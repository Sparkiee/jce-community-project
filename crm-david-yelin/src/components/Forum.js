import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import "../styles/Forum.css";
import IconButton from "@mui/material/IconButton";
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";

const Forum = ({ eventId, type, name }) => {
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [editingReply, setEditingReply] = useState({ commentId: null, replyIndex: null });
  const [newComment, setNewComment] = useState("");
  const [editComment, setEditComment] = useState("");
  const [newReply, setNewReply] = useState("");
  const [editReply, setEditReply] = useState("");
  const [user, setUser] = useState(null);

  const convertTextToLinksJSX = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const parts = text.split(/(\n|(?:https?:\/\/[^\s]+)|(?:www\.[^\s]+))/g);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        let href = part;
        if (part.startsWith("www.")) {
          href = "http://" + part;
        }
        return (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      } else if (part === "\n") {
        return <br key={index} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // load on page load
  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  const fetchUserDetails = async (email) => {
    const userRef = doc(db, "members", email);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return { fullName: "Unknown User" };
    }
  };

  const fetchComments = async () => {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    const commentsList = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const authorDetails = await fetchUserDetails(data.authorEmail);
        const replies = data.replies
          ? await Promise.all(
              data.replies.map(async (reply) => {
                const replyAuthorDetails = await fetchUserDetails(reply.authorEmail);
                return {
                  ...reply,
                  author: replyAuthorDetails.fullName,
                  timestamp: reply.timestamp ? reply.timestamp.toDate() : new Date(),
                };
              })
            )
          : [];
        return {
          ...data,
          id: doc.id,
          author: authorDetails.fullName,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          replies,
        };
      })
    );
    commentsList.sort((a, b) => a.timestamp - b.timestamp);
    setComments(commentsList);
  };

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;
    await addDoc(collection(db, "comments"), {
      eventId,
      text: newComment,
      authorEmail: user.email,
      timestamp: new Date(),
    });
    setNewComment("");
    fetchComments();
  };

  const handleEditComment = async (commentId) => {
    if (editComment.trim() === "") return;
    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, {
      text: editComment,
    });
    setEditingCommentId(null);
    setEditComment("");
    fetchComments();
  };

  const handleDeleteComment = async (commentId) => {
    const commentRef = doc(db, "comments", commentId);
    await deleteDoc(commentRef);
    fetchComments();
  };

  const handleReply = async (commentId) => {
    if (newReply.trim() === "") return;
    const commentRef = doc(db, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    if (commentSnap.exists()) {
      const commentData = commentSnap.data();
      const updatedReplies = commentData.replies || [];
      updatedReplies.push({
        text: newReply,
        timestamp: new Date(),
        authorEmail: user.email,
      });
      await updateDoc(commentRef, {
        replies: updatedReplies,
      });
      setNewReply("");
      setReplyCommentId(null);
      fetchComments();

      if (user.email === commentData.authorEmail) return;
      const memberRef = doc(db, "members", commentData.authorEmail);
      let message = "";
      let link = "";
      if (type === "event") {
        message = `${user.fullName} השיב לתגובה שלך באירוע ${name}`;
        link = `/event/${eventId}`;
      }
      if (type === "task") {
        message = `${user.fullName} השיב לתגובה שלך במשימה ${name}`;
        link = `/task/${eventId}`;
      }
      await updateDoc(memberRef, {
        Notifications: arrayUnion({
          event: eventId,
          message: message,
          link: link,
          id: uuidv4(),
        }),
      });
    }
  };

  const handleEditReply = async (commentId, replyIndex) => {
    if (editReply.trim() === "") return;
    const commentRef = doc(db, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    if (commentSnap.exists()) {
      const commentData = commentSnap.data();
      const updatedReplies = commentData.replies || [];
      updatedReplies[replyIndex].text = editReply;
      await updateDoc(commentRef, {
        replies: updatedReplies,
      });
      setEditingReply({ commentId: null, replyIndex: null });
      setEditReply("");
      fetchComments();
    }
  };

  const handleDeleteReply = async (commentId, replyIndex) => {
    const commentRef = doc(db, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    if (commentSnap.exists()) {
      const commentData = commentSnap.data();
      const updatedReplies = commentData.replies || [];
      updatedReplies.splice(replyIndex, 1);
      await updateDoc(commentRef, {
        replies: updatedReplies,
      });
      fetchComments();
    }
  };

  const handleKeyDown = (event, callback) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      callback();
    }
  };

  const totalReplies = comments.reduce(
    (acc, comment) => acc + (comment.replies ? comment.replies.length : 0),
    0
  );
  const totalCommentsAndReplies = comments.length + totalReplies;

  return (
    <div className="discussion-list">
      <div className="discussion-header">
        <div className="new-comment">
          <h2>{user && user.fullName}</h2>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="הקלד תגובה כאן..."
            onKeyDown={(e) => handleKeyDown(e, handleAddComment)}
          />
          <button onClick={handleAddComment}>שתף תגובה</button>
        </div>
      </div>
      <div className="comments-area">
        <h2>{totalCommentsAndReplies} תגובות</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="discussion-block">
            <div className="comment-item">
              <div className="comment-header">
                <div className="author-name">
                  <Link to={`/profile/${comment.authorEmail}`}>{comment.author}</Link>
                </div>
                <div className="comment-timestamp">
                  {new Date(comment.timestamp).toLocaleString("en-GB", {
                    hour12: false,
                  })}
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleEditComment(comment.id))}
                />
              ) : (
                <div className="comment-content">
                  <p>{convertTextToLinksJSX(comment.text)}</p>
                </div>
              )}
              <div className="discussion-actions">
                {editingCommentId === comment.id ? (
                  <button className="save-icon" onClick={() => handleEditComment(comment.id)}>
                    שמור שינויים
                  </button>
                ) : (
                  <>
                    {comment.authorEmail === user.email && (
                      <IconButton
                        title="ערוך"
                        onClick={() => {
                          setEditingCommentId(comment.id);

                          setEditComment(comment.text);
                        }}>
                        <EditIcon />
                      </IconButton>
                    )}
                    {(user.privileges >= 2 ||
                      comment.authorEmail === user.email ||
                      user.adminAccess.includes("deleteComment")) && (
                      <>
                        <IconButton title="מחק" onClick={() => handleDeleteComment(comment.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton title="הגב" onClick={() => setReplyCommentId(comment.id)}>
                      <ReplyIcon />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
            <div className="discussion-replies">
              {comment.replies &&
                comment.replies.map((reply, index) => (
                  <div key={index} className="discussion-reply">
                    <div className="reply-header">
                      <div className="author-name">
                        <Link to={`/profile/${reply.authorEmail}`}>{reply.author}</Link>
                      </div>
                      <div className="comment-timestamp">
                        {new Date(reply.timestamp).toLocaleString("en-GB", {
                          hour12: false,
                        })}
                      </div>
                    </div>
                    {editingReply.commentId === comment.id && editingReply.replyIndex === index ? (
                      <textarea
                        value={editReply}
                        onChange={(e) => setEditReply(e.target.value)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, () => handleEditReply(comment.id, index))
                        }
                      />
                    ) : (
                      <div className="reply-content">
                        <p>{convertTextToLinksJSX(reply.text)}</p>
                      </div>
                    )}
                    <div className="discussion-actions">
                      {editingReply.commentId === comment.id &&
                      editingReply.replyIndex === index ? (
                        <button
                          className="save-icon"
                          onClick={() => handleEditReply(comment.id, index)}>
                          שמור שינויים
                        </button>
                      ) : (
                        <>
                          {reply.authorEmail === user.email && (
                            <IconButton
                              title="ערוך"
                              onClick={() => {
                                setEditingReply({ commentId: comment.id, replyIndex: index });

                                setEditReply(reply.text);
                              }}>
                              <EditIcon />
                            </IconButton>
                          )}
                          {(user.privileges >= 2 ||
                            reply.authorEmail === user.email ||
                            user.adminAccess.includes("deleteComment")) && (
                            <>
                              <IconButton
                                title="מחק"
                                onClick={() => handleDeleteReply(comment.id, index)}>
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              {replyCommentId === comment.id && (
                <div className="reply-area">
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="הקלד תגובה כאן..."
                    onKeyDown={(e) => handleKeyDown(e, () => handleReply(comment.id))}
                  />
                  <button onClick={() => handleReply(comment.id)}>שלח תגובה</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forum;
