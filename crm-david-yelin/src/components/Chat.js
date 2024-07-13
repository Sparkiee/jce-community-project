import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import "../styles/Chat.css";
import InfoIcon from "@mui/icons-material/Info";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import ImageIcon from "@mui/icons-material/Image";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import CircularProgress from "@mui/material/CircularProgress";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import Box from "@mui/material/Box";
import { db, storage } from "../firebase";
import {
  getDoc,
  doc,
  serverTimestamp,
  getDocs,
  collection,
  onSnapshot,
  query,
  where,
  arrayUnion,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function Chat() {
  function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  }

  function stringAvatar(name) {
    const names = name.split(" ");
    const firstInitial = names[0] ? names[0][0] : "";
    const secondInitial = names[1] ? names[1][0] : "";
    return {
      sx: {
        bgcolor: stringToColor(name),
      },
      children: `${firstInitial}${secondInitial}`,
    };
  }

  const [addMode, setAddMode] = useState(false);
  const [emojiMode, setEmojiMode] = useState(false);
  const [text, setText] = useState("");
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [isChatsLoading, setIsChatsLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const navigate = useNavigate();
  const [messagesPerPage, setMessagesPerPage] = useState(20);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const searchBoxref = useRef(null);
  const fileInputRef = useRef(null);

  const handleChatSearch = (e) => {
    setChatSearchQuery(e.target.value);
  };

  const handleLoadMore = () => {
    setMessagesPerPage((prevCount) => prevCount + 20);
    fetchMessagesforChat(selectedChat, true);
  };

  const filteredChats = chats.filter(
    (chat) =>
      (chat.fullName && chat.fullName.toLowerCase().includes(chatSearchQuery.toLowerCase())) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(chatSearchQuery.toLowerCase()))
  );

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  async function getMemberFullName(email) {
    try {
      const memberDoc = await getDoc(doc(collection(db, "members"), email));
      if (memberDoc.exists()) {
        return memberDoc.data().fullName;
      }
    } catch (e) {
      console.error("Error getting member document: ", e);
    }
  }

  const fetchUserChats = async () => {
    if (!user) return;

    try {
      const chatRef = collection(db, "chats");
      const q = query(chatRef, where("members", "array-contains", user.email));
      const querySnapshot = await getDocs(q);
      let chatArray = [];
      for (const doc of querySnapshot.docs) {
        let otherUserEmail = doc.data().members.find((email) => email !== user.email);
        const fullName = await getMemberFullName(otherUserEmail); // Now it's valid to use await here
        const chat = doc.data();
        const unseenCount = chat.messages.filter(
          (message) =>
            message.sender !== user.email &&
            !message.seen &&
            (!selectedChat || selectedChat.chatId !== doc.id)
        ).length;
        chatArray.push({ chatId: doc.id, otherUserEmail, fullName, unseenCount, ...chat });
      }
      setChats(chatArray);
    } catch (error) {
      console.error("Failed to fetch user chats:", error);
    } finally {
      setIsChatsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserChats();
  }, [user]);

  useEffect(() => {
    setMessages(selectedChat?.messages);
  }, [selectedChat]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setEmojiMode(false);
  };

  useEffect(() => {
    if (user) {
      const chatRef = collection(db, "chats");
      const q = query(chatRef, where("members", "array-contains", user.email));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            fetchUserChats();
          }
        });
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchValue = e.target.username.value;
    setSearchQuery(searchValue);
    if (searchValue.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchLoading(true);
    try {
      const q = query(
        collection(db, "members"),
        where("fullName", ">=", searchValue),
        where("fullName", "<=", searchValue + "\uf8ff"),
        where("privileges", ">", 0)
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => doc.data());
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching for users:", error);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  useEffect(() => {
    const closeSearchBox = (event) => {
      if (
        searchBoxref.current &&
        !searchBoxref.current.contains(event.target) &&
        !event.target.closest(".chat-list-search-add-minus")
      ) {
        setAddMode(false);
        setSearchResults([]);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", closeSearchBox);

    return () => {
      document.removeEventListener("mousedown", closeSearchBox);
    };
  }, [searchBoxref]);

  const handleChatListSearchAddMinusClick = (event) => {
    event.stopPropagation();
    setAddMode((prev) => !prev);
  };

  const handleImageIconClick = (event) => {
    event.stopPropagation();
    fileInputRef.current.click();
  };

  const handleAddUser = async (userToAdd) => {
    try {
      const targetEmail = userToAdd.email;
      const currentUserEmail = user.email;
      setAddMode(false);
      if (currentUserEmail === targetEmail) return;

      const chatRef = collection(db, "chats");

      const q = query(chatRef, where("members", "array-contains", currentUserEmail));
      const querySnapshot = await getDocs(q);

      let chatExists = false;
      querySnapshot.forEach((doc) => {
        const members = doc.data().members;
        if (members.includes(targetEmail)) {
          chatExists = true;
        }
      });

      if (chatExists) {
        console.log("Chat already exists with this user");
        return;
      }

      await addDoc(collection(db, "chats"), {
        members: [currentUserEmail, targetEmail],
        messages: [],
        updatedAt: serverTimestamp(),
      });
      setSearchResults([]);
      setSearchQuery("");
      fetchUserChats();
    } catch (e) {
      console.log("error: ", e);
    }
  };

  const handleChatSelection = async (chat) => {
    setSelectedChat(chat);
    console.log("chat", chat);
    fetchMessagesforChat(chat);
    if (chat.unseenCount > 0) {
      const chatRef = doc(db, "chats", chat.chatId);
      const updatedMessages = chat.messages.map((message) =>
        message.sender !== user.email && !message.seen ? { ...message, seen: true } : message
      );
      await updateDoc(chatRef, { messages: updatedMessages });
      fetchUserChats();
    }
  };

  const handleSendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || !selectedChat) return;
    const chatRef = doc(db, "chats", selectedChat.chatId);
    try {
      const message = {
        text: trimmedText,
        sender: user.email,
        timestamp: new Date(),
        seen: false,
      };
      await updateDoc(chatRef, {
        lastMessage: trimmedText,
        updatedAt: serverTimestamp(),
        messages: arrayUnion(message),
      });
      setText("");
      setMessages((prevMessages) => [...prevMessages, message]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const fetchMessagesforChat = async (selectedChat, loadMore = false) => {
    const chatRef = doc(db, "chats", selectedChat.chatId);
    try {
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      let allMessages = chatData.messages;
      let messages = allMessages.slice(-messagesPerPage);

      setHasMoreMessages(allMessages.length > messages.length);

      let needsUpdate = false;
      messages = messages.map((message) => {
        if (message.sender !== user.email && !message.seen) {
          message.seen = true;
          needsUpdate = true;
        }
        return message;
      });

      if (loadMore) {
        setMessages((prevMessages) => [...messages, ...prevMessages]);
      } else {
        setMessages(messages);
      }

      if (needsUpdate) {
        await updateDoc(chatRef, { messages: allMessages });
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.chatId === selectedChat.chatId
              ? { ...chat, messages: allMessages, unseenCount: 0 }
              : chat
          )
        );
      }
    } catch (e) {
      console.error("Error fetching messages for chat:", e);
    }
  };

  useEffect(() => {
    const subscribeCurrentChat = async () => {
      if (!db || !selectedChat?.chatId) {
        return;
      }

      const unsubscribe = onSnapshot(doc(db, "chats", selectedChat.chatId), async (docSnapshot) => {
        const chatData = docSnapshot.data();
        if (chatData) {
          const allMessages = chatData.messages;
          const newMessages = allMessages.slice(-messagesPerPage);
          setHasMoreMessages(allMessages.length > newMessages.length);
          setMessages(newMessages);
        }
      });

      return unsubscribe;
    };

    const unsubscribePromise = subscribeCurrentChat();
    return () => {
      unsubscribePromise.then((unsub) => {
        if (unsub) {
          unsub();
        }
      });
    };
  }, [selectedChat, db, messagesPerPage]);

  const convertTextToLinksJSX = (text) => {
    if (!text) {
      return null; // Return null if text is undefined or null
    }

    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part?.match(urlRegex)) {
        let href = part;
        if (part.startsWith("www.")) {
          href = "http://" + part;
        }
        return (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && text.trim() !== "") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && selectedChat) {
      const storageRef = ref(storage, `chat/${selectedChat.chatId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const chatRef = doc(db, "chats", selectedChat.chatId);
      const message = {
        img: url,
        sender: user.email,
        timestamp: new Date(), // Set the timestamp as a date object
        seen: false,
      };
      await updateDoc(chatRef, {
        lastMessage: "[Image]",
        updatedAt: serverTimestamp(),
        messages: arrayUnion(message),
      });
      fetchMessagesforChat(selectedChat);
    }
  };

  return (
    <div className="chat-body">
      <div className="chat-container">
        <div className="chat-list-container">
          <div className="chat-user-info">
            <div className="chat-user-info-avatar">
              {user && (
                <Avatar
                  {...stringAvatar(user.fullName)}
                  title={user.fullName}
                  className="chat-user-info-profile-avatar"
                  onClick={() => navigate(`/profile/${user.email}`)}
                />
              )}
              <h2>{user && user.fullName}</h2>
            </div>
          </div>
          <div className="chat-list">
            {isChatsLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <div className="chat-list-search">
                  <div className="chat-list-search-bar">
                    <svg
                      viewBox="0 0 32 32"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#000000">
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <title>search</title>
                        <desc>Created with Sketch Beta.</desc>
                        <defs></defs>
                        <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                          <g
                            id="Icon-Set"
                            transform="translate(-256.000000, -1139.000000)"
                            fill="#000000">
                            <path
                              d="M269.46,1163.45 C263.17,1163.45 258.071,1158.44 258.071,1152.25 C258.071,1146.06 263.17,1141.04 269.46,1141.04 C275.75,1141.04 280.85,1146.06 280.85,1152.25 C280.85,1158.44 275.75,1163.45 269.46,1163.45 L269.46,1163.45 Z M287.688,1169.25 L279.429,1161.12 C281.591,1158.77 282.92,1155.67 282.92,1152.25 C282.92,1144.93 276.894,1139 269.46,1139 C262.026,1139 256,1144.93 256,1152.25 C256,1159.56 262.026,1165.49 269.46,1165.49 C272.672,1165.49 275.618,1164.38 277.932,1162.53 L286.224,1170.69 C286.629,1171.09 287.284,1171.09 287.688,1170.69 C288.093,1170.3 288.093,1169.65 287.688,1169.25 L287.688,1169.25 Z"
                              id="search"></path>
                          </g>
                        </g>
                      </g>
                    </svg>
                    <input
                      type="text"
                      className="open-chat-search"
                      placeholder="חפש משתמש..."
                      value={chatSearchQuery}
                      onChange={handleChatSearch}
                    />
                  </div>
                  <div
                    className="chat-list-search-add-minus"
                    onClick={(event) => handleChatListSearchAddMinusClick(event)}>
                    {!addMode ? (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g
                          id="SVGRepo_tracerCarrier"
                          strokeLinecap="round"
                          strokeLinejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                          <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="#ffffff"></path>
                        </g>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g
                          id="SVGRepo_tracerCarrier"
                          strokeLinecap="round"
                          strokeLinejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                          <path
                            d="M6 12L18 12"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"></path>
                        </g>
                      </svg>
                    )}
                  </div>
                </div>
                {filteredChats.map((chat, index) => (
                  <div
                    className={`chat-list-item ${
                      selectedChat && selectedChat.chatId === chat.chatId ? "selected" : ""
                    }`}
                    key={index}
                    onClick={() => handleChatSelection(chat)}>
                    <div className="chat-list-item-right-side">
                      <Avatar
                        {...stringAvatar(chat && chat.fullName)}
                        title={chat.fullName || "Unknown Name"}
                        className="chat-list-item-avatar"
                      />
                      <div className="chat-list-item-texts">
                        <span>{chat.fullName}</span>
                        <p>{chat.lastMessage}</p>
                      </div>
                    </div>
                    {chat.unseenCount > 0 && (
                      <Badge
                        badgeContent={chat.unseenCount}
                        color="primary"
                        className="chat-list-item-badge"
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        {selectedChat ? (
          <>
            <div className="chat-messages-container">
              <div className="chat-messages-top">
                <div className="chat-messages-top-avatar">
                  <Avatar
                    {...stringAvatar(selectedChat?.fullName || "Unknown Name")}
                    title={selectedChat.fullName || "Unknown Name"}
                    className="chat-messages-top-avatar-img"
                  />
                  <div className="chat-messages-top-avatar-texts">
                    <span>{selectedChat.fullName}</span>
                  </div>
                </div>
                <div className="chat-messages-top-icons">
                  <InfoIcon
                    onClick={() =>
                      navigate(
                        `/profile/${
                          selectedChat.otherUserEmail === user.email
                            ? user.email
                            : selectedChat.otherUserEmail
                        }`
                      )
                    }
                  />
                </div>
              </div>
              <div className="chat-messages-center">
                {hasMoreMessages && (
                  <button onClick={handleLoadMore} className="load-more-button">
                    Load More
                  </button>
                )}
                {messages &&
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-messages-center-message-${
                        message.sender === user.email ? "own" : "other"
                      }`}>
                      <div className="chat-messages-center-message-texts">
                        <pre className="chat-messages-center-message-box">
                          {message.img && (
                            <img
                              src={message.img}
                              onClick={() => window.open(message.img, "_blank")}
                              style={{ cursor: "pointer", maxWidth: "200px" }}
                            />
                          )}
                          {convertTextToLinksJSX(message.text)}
                          {message.sender === user.email && (
                            <DoneAllIcon
                              className="chat-messages-center-message-seen-icon"
                              style={{
                                color: message.seen ? "blue" : "#a5a5a5",
                              }}
                            />
                          )}
                        </pre>
                        <span className="chat-messages-center-time-stamp">
                          {new Date(
                            message.timestamp.seconds * 1000 +
                              message.timestamp.nanoseconds / 1000000
                          ).toLocaleString("en-GB", { hour12: false })}
                        </span>
                      </div>
                    </div>
                  ))}
                <div></div>
              </div>
              <div className="chat-messages-bottom">
                <div className="chat-messages-bottom-icons">
                  <ImageIcon onClick={handleImageIconClick} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
                <textarea
                  className="chat-messages-bottom-input"
                  type="text"
                  placeholder="שלח הודעה..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="chat-messages-bottom-emoji">
                  <EmojiEmotionsIcon onClick={() => setEmojiMode((prev) => !prev)} />
                  <div className="chat-messages-bottom-emoji-picker">
                    <EmojiPicker open={emojiMode} onEmojiClick={handleEmoji} />
                  </div>
                </div>
                <button className="chat-messages-send-button" onClick={handleSendMessage}>
                  שלח
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-messages-container">
            <div className="chat-messages-center">
              <p className="chose-chat">בחר משתמש כדי להתחיל שיחה.</p>
            </div>
          </div>
        )}
      </div>
      {addMode && (
        <div ref={searchBoxref} className="chat-add-user">
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="שם משתמש" name="username" />
            <button type="submit">חפש</button>
          </form>
          {searchQuery && (
            <div className="chat-user">
              {isSearchLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                  <CircularProgress />
                </Box>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div className="chat-user-list" key={user.email}>
                    <div className="chat-user-detail">
                      <Avatar
                        {...stringAvatar(user.fullName || "Unknown Name")}
                        title={user.fullName || "Unknown Name"}
                        className="chat-user-avatar"
                      />
                      <h2>{user.fullName}</h2>
                    </div>
                    <button onClick={() => handleAddUser(user)}>הוסף</button>
                  </div>
                ))
              ) : (
                <p>לא נמצא משתמש פעיל</p>
              )}
            </div>
          )}
        </div>
      )}
      <div className="footer"></div>
    </div>
  );
}

export default Chat;
