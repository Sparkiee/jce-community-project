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
  const [addMode, setAddMode] = useState(false);
  const [emojiMode, setEmojiMode] = useState(false);
  const [text, setText] = useState("");
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);

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

      // Subscribe to the member document to listen for chat updates
      const unSub = onSnapshot(memberDocRef, async (res) => {
        const items = res.data()?.chats || [];
        if (items.length > 0) {
          const chatData = await Promise.all(
            items.map(async (item) => {
              const chatDocRef = doc(db, "members", item.member);
              const chatDocSnap = await getDoc(chatDocRef);
              const chatUser = chatDocSnap.data();
              return { ...item, ...chatUser };
            })
          );
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        } else {
          setChats([]);
        }
      });

      return () => unSub();
    };

    checkAndCreateChat();
  }, [user.email]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView();
    }
  }, [selectedChat]);

  const handleEmoji = (e) => {
    console.log(e);
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
      if (
        currentUserData.chats &&
        currentUserData.chats.some((chat) => chat.member === userToAdd.email)
      ) {
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
      };

      const newChat = { ...newChatItem, ...userToAdd };
      setChats((prevChats) => {
        if (prevChats.some((chat) => chat.member === userToAdd.email)) {
          return prevChats;
        }
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

  return (
    <div className="chat-body">
      <div className="chat-container">
        <div className="chat-list-container">
          <div className="chat-user-info">
            <div className="chat-user-info-avatar">
              <img src={require("../assets/profile.jpg")} alt="profile" />
              <h2>Monkey D. Luffy</h2>
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
            {chats.map((chat) => (
              <div
                className={`chat-list-item ${
                  selectedChat && selectedChat.chatId === chat.chatId ? "selected" : ""
                }`}
                key={chat.chatId}
                onClick={() => setSelectedChat(chat)}>
                <img src={require("../assets/profile.jpg")} alt="profile" />
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
                  <img src={require("../assets/profile.jpg")} alt="profile" />
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
                <div className="chat-messages-center-message-own">
                  <div className="chat-messages-center-message-texts">
                    <img src={require("../assets/profile.jpg")} alt="profile" />
                    <p>
                      זוהי עובדה מבוססת שדעתו של הקורא תהיה מוסחת על ידי טקטס קריא כאשר הוא יביט
                      בפריסתו.{" "}
                    </p>
                    <span>1 min ago</span>
                  </div>
                </div>
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
                <button className="chat-messages-send-button">שלח</button>
              </div>
            </div>
            <div className="chat-detail-container">
              <div className="chat-detail-user">
                <img src={require("../assets/profile.jpg")} alt="profile" />
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
