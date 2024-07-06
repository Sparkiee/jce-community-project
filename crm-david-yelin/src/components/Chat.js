import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import "../styles/Chat.css";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VideocamIcon from "@mui/icons-material/Videocam";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import InfoIcon from "@mui/icons-material/Info";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import ImageIcon from "@mui/icons-material/Image";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MicIcon from "@mui/icons-material/Mic";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Avatar from "@mui/material/Avatar";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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
    if (typeof name !== "string") {
      return { children: "Unknown" };
    }
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

  const user = JSON.parse(sessionStorage.getItem("user"));
  const endRef = useRef(null);

  useEffect(() => {
    const checkAndCreateChat = async () => {
      const memberDocRef = doc(db, "members", user.email);
      const docSnap = await getDoc(memberDocRef);

      // Check if the 'chats' field exists, if not, create it
      if (!docSnap.exists() || !docSnap.data().chats) {
        await setDoc(
          memberDocRef,
          { ...docSnap.data(), chats: [], updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
    };

    checkAndCreateChat();
  }, [user.email]);

  useEffect(() => {
    const fetchUserChats = async () => {
      try {
        const userRef = doc(db, "members", user.email);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          let chatArray = []; // Initialize as an array
          if (userData.chats) {
            userData.chats.forEach((chat) => {
              chatArray.push(chat); // Push each chat object into the array
            });
            setChats(chatArray); // Set the state with the array of chats
            console.log("chatArray", chatArray);
          } else {
            console.log("No chats data found for the user.");
          }
        } else {
          console.log("No document found for the user.");
        }
      } catch (error) {
        console.error("Failed to fetch user chats:", error);
      }
    };

    fetchUserChats();
  }, []);

  useEffect(() => {
    if (user && selectedChat) {
      const userRef = doc(db, "members", user.email);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          if (userData.chats && typeof userData.chats === "object") {
            const currentChat = userData.chats[selectedChat.chatId];
            if (currentChat) {
              setMessages(currentChat.messages || []);
            }
          } else {
            console.error("Chats data structure is not as expected:", userData.chats);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [user, selectedChat]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView();
    }
  }, [selectedChat]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setEmojiMode(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const searchValue = e.target.username.value;
    setSearchQuery(searchValue);
    if (searchValue.length < 2) {
      setSearchResults([]);
      return;
    }

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
    }
  };

  const handleAddUser = async (userToAdd) => {
    try {
      const currentUserEmail = user.email;
      const currentUserRef = doc(db, "members", currentUserEmail);
      const userToAddRef = doc(db, "members", userToAdd.email);

      // Get current user's data
      const currentUserDoc = await getDoc(currentUserRef);
      const currentUserData = currentUserDoc.data();

      // Check if chat already exists
      if (currentUserData.chats && currentUserData.chats[userToAdd.email]) {
        console.log("Chat already exists with this user");
        return;
      }

      // Generate a unique chatId
      const chatId = doc(collection(db, "chats")).id;

      // Get current timestamp
      const now = new Date().toISOString();

      // Create new chat item
      const newChatItem = {
        chatId: chatId,
        lastMessage: "",
        member: userToAdd.email,
        updatedAt: now,
        messages: [],
      };

      const newChat = { ...newChatItem, ...userToAdd };
      setChats((prevChats) => {
        if (prevChats.some((chat) => chat.member === userToAdd.email)) {
          return prevChats;
        }
        console.log("newChat", ...prevChats, newChat);
        return [...prevChats, newChat];
      });
      setSelectedChat(newChat);

      // Update current user's chats array
      await updateDoc(currentUserRef, {
        chats: arrayUnion(newChatItem),
        updatedAt: serverTimestamp(),
      });

      // Create chat item for the other user
      const otherUserChatItem = {
        chatId: chatId,
        lastMessage: "",
        member: currentUserEmail,
        updatedAt: now,
        messages: [],
      };

      // Update the other user's chats array
      await updateDoc(userToAddRef, {
        chats: arrayUnion(otherUserChatItem),
        updatedAt: serverTimestamp(),
      });

      console.log("User added to chat successfully");

      // Update local state to reflect the new chat
      setChats((prevChats) => {
        // Check if the chat already exists in the local state
        if (prevChats.some((chat) => chat.member === userToAdd.email)) {
          return prevChats; // Don't add if it already exists
        }
        return [...prevChats, { ...newChatItem, ...userToAdd }];
      });

      // Close the add user modal
      setAddMode(false);

      // Clear search results
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error adding user to chat:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!text || !selectedChat) return;

    const currentUserRef = doc(db, "members", user.email);
    const otherUserRef = doc(db, "members", selectedChat.member);

    try {
      const now = new Date();

      const message = {
        text: text,
        sender: user.email,
        createdAt: now,
      };

      const updateData = {
        [`chats.${selectedChat.chatId}.lastMessage`]: text,
        [`chats.${selectedChat.chatId}.updatedAt`]: serverTimestamp(),
        [`chats.${selectedChat.chatId}.isSeen`]: true,
      };

      // Update current user's document
      await updateDoc(currentUserRef, updateData);
      await updateDoc(currentUserRef, {
        [`chats.${selectedChat.chatId}.messages`]: arrayUnion(message),
      });

      // Update other user's document
      updateData[`chats.${selectedChat.chatId}.isSeen`] = false;
      await updateDoc(otherUserRef, updateData);
      await updateDoc(otherUserRef, {
        [`chats.${selectedChat.chatId}.messages`]: arrayUnion(message),
      });

      console.log("Message sent successfully");
      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-body">
      <div className="chat-container">
        <div className="chat-list-container">
          <div className="chat-user-info">
            <div className="chat-user-info-avatar">
              <Avatar
                {...stringAvatar(user.fullName)}
                title={user.fullName}
                className="chat-user-info-profile-avatar"
              />
              <h2>{user.fullName}</h2>
            </div>
            <div className="chat-user-info-icons">
              <MoreHorizIcon />
              <VideocamIcon />
              <EditIcon />
            </div>
          </div>
          <div className="chat-list">
            <div className="chat-list-search">
              <div className="chat-list-search-bar">
                <svg
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
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
                <input type="text" placeholder="Search" />
              </div>
              <div className="chat-list-search-add-minus">
                {!addMode ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={() => setAddMode(true)}>
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
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
                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M6 12L18 12"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"></path>{" "}
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
                onClick={() => setSelectedChat(chat)}>
                <Avatar
                  {...stringAvatar(chat?.fullName || "Unknown Name")}
                  title={chat.fullName || "Unknown Name"}
                  className="chat-list-item-avatar"
                />
                <div className="chat-list-item-texts">
                  <span>{chat.fullName}</span>
                  <p>{chat.lastMessage}</p>
                </div>
              </div>
            ))}
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
                    <p>{selectedChat.lastMessage}</p>
                  </div>
                </div>
                <div className="chat-messages-top-icons">
                  <PhoneIcon />
                  <VideocamIcon />
                  <InfoIcon />
                </div>
              </div>
              <div className="chat-messages-center">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-messages-center-message-${
                      message.sender === user.email ? "own" : "other"
                    }`}>
                    <div className="chat-messages-center-message-texts">
                      {message.img && <img src={message.img} />}
                      <p>{message.text}</p>
                      <span>{message.timestamp}</span>
                    </div>
                  </div>
                ))}
                <div ref={endRef}></div>
              </div>
              <div className="chat-messages-bottom">
                <div className="chat-messages-bottom-icons">
                  <ImageIcon />
                  <CameraAltIcon />
                  <MicIcon />
                </div>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
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
            <div className="chat-detail-container">
              <div className="chat-detail-user">
                <Avatar
                  {...stringAvatar(selectedChat?.fullName || "Unknown Name")}
                  title={selectedChat.fullName || "Unknown Name"}
                  className="chat-detail-user-avatar"
                />
                <h2>{selectedChat.fullName}</h2>
                <p>{selectedChat.lastMessage}</p>
              </div>
              <div className="chat-detail-info">
                <div className="chat-detail-info-option">
                  <div className="chat-detail-info-option-title">
                    <span>הגדרות צא'ט</span>
                    <KeyboardArrowUpIcon />
                  </div>
                </div>
                <div className="chat-detail-info-option">
                  <div className="chat-detail-info-option-title">
                    <span>פרטיות & עזרה</span>
                    <KeyboardArrowUpIcon />
                  </div>
                </div>
                <div className="chat-detail-info-option">
                  <div className="chat-detail-info-option-title">
                    <span>מדיה</span>
                    <KeyboardArrowDownIcon />
                  </div>
                  <div className="chat-detail-info-option-media">
                    <div className="chat-detail-info-option-media-item">
                      <div className="chat-detail-info-option-media-item-detail">
                        <img src={require("../assets/img1.jpg")} alt="profile" />
                        <span>Image_2024.png</span>
                      </div>
                      <FileDownloadIcon className="chat-detail-download-icon" />
                    </div>
                    <div className="chat-detail-info-option-media-item">
                      <div className="chat-detail-info-option-media-item-detail">
                        <img src={require("../assets/img2.jpg")} alt="profile" />
                        <span>Image_2024.png</span>
                      </div>
                      <FileDownloadIcon className="chat-detail-download-icon" />
                    </div>
                    <div className="chat-detail-info-option-media-item">
                      <div className="chat-detail-info-option-media-item-detail">
                        <img src={require("../assets/img3.jpg")} alt="profile" />
                        <span>Image_2024.png</span>
                      </div>
                      <FileDownloadIcon className="chat-detail-download-icon" />
                    </div>
                    <div className="chat-detail-info-option-media-item">
                      <div className="chat-detail-info-option-media-item-detail">
                        <img src={require("../assets/img4.jpg")} alt="profile" />
                        <span>Image_2024.png</span>
                      </div>
                      <FileDownloadIcon className="chat-detail-download-icon" />
                    </div>
                  </div>
                </div>
                <div className="chat-detail-info-option">
                  <div className="chat-detail-info-option-title">
                    <span>קבצים משתופים</span>
                    <KeyboardArrowUpIcon />
                  </div>
                </div>
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
              {searchResults && searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div className="chat-user-list" key={user.email}>
                    <div className="chat-user-detail">
                      <img src={require("../assets/profile.jpg")} alt="profile" />
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
