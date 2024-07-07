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
import Box from "@mui/material/Box";
import { db } from "../firebase";
import {
  getDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  where,
  arrayUnion,
  updateDoc,
  addDoc,
} from "firebase/firestore";

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

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  const endRef = useRef(null);

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
    if (!selectedChat) {
      setIsChatsLoading(true);
    }

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
          (message) => message.sender !== user.email && !message.seen
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

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView();
    }
  }, [messages]);

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
        where("fullName", "<=", searchValue + "\uf8ff")
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

  const handleAddUser = async (userToAdd) => {
    try {
      const targetEmail = userToAdd.email;
      const currentUserEmail = user.email;
      setAddMode(false);
      if (currentUserEmail === targetEmail) return;

      const chatRef = collection(db, "chats");

      // Query for chats where members contain currentUserEmail
      const q = query(chatRef, where("members", "array-contains", currentUserEmail));
      const querySnapshot = await getDocs(q);

      // Filter the results to check if any chat contains targetEmail as well
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
    if (!text || !selectedChat) return;
    const chatRef = doc(db, "chats", selectedChat.chatId);
    try {
      const now = new Date();
      const message = {
        text: text,
        sender: user.email,
        timestamp: now,
        seen: false,
      };
      await updateDoc(chatRef, {
        lastMessage: text,
        updatedAt: now,
        messages: arrayUnion(message),
      });
      setText("");
      fetchMessagesforChat(selectedChat);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const fetchMessagesforChat = async (selectedChat) => {
    const chatRef = doc(db, "chats", selectedChat.chatId);
    onSnapshot(chatRef, (doc) => {
      setMessages(doc.data().messages);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && text.trim() !== "") {
      handleSendMessage();
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
                    <input type="text" placeholder="חפש משתמש..." />
                  </div>
                  <div className="chat-list-search-add-minus">
                    {!addMode ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        onClick={() => setAddMode(true)}>
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
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        onClick={() => setAddMode(false)}>
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
                {chats.map((chat, index) => (
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
        {selectedChat && (
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
                {messages &&
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`chat-messages-center-message-${
                        message.sender === user.email ? "own" : "other"
                      }`}>
                      <div className="chat-messages-center-message-texts">
                        {message.img && <img src={message.img} />}
                        <pre>{message.text}</pre>
                        <span>
                          {new Date(
                            message.timestamp.seconds * 1000 +
                              message.timestamp.nanoseconds / 1000000
                          ).toLocaleString("en-GB", { hour12: false })}
                        </span>
                      </div>
                    </div>
                  ))}
                <div ref={endRef}></div>
              </div>
              <div className="chat-messages-bottom">
                <div className="chat-messages-bottom-icons">
                  <ImageIcon />
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
        )}
      </div>
      {addMode && (
        <div className="chat-add-user">
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
                <p>לא נמצא משתמש</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;
