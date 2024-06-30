import React, { useState, useEffect } from "react";
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
} from "firebase/firestore";
import "../styles/Discussion.css";
import IconButton from "@mui/material/IconButton";
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";

const DiscussionList = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [editComment, setEditComment] = useState("");
  const [newReply, setNewReply] = useState("");
  const [userEmail, setUserEmail] = useState(""); 

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem('user'));
    if (storedUser && storedUser.email) {
      setUserEmail(storedUser.email); // Записываем email пользователя из sessionStorage
    }
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    const commentsList = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(), // Преобразуем timestamp в Date объект
    }));
    commentsList.sort((a, b) => a.timestamp - b.timestamp); // Сортировка комментариев по timestamp
    setComments(commentsList);
  };

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;
    await addDoc(collection(db, "comments"), {
      eventId,
      text: newComment,
      authorEmail: userEmail, // Добавляем email пользователя к комментарию
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
      timestamp: new Date(),
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
        author: userEmail,
      });
      await updateDoc(commentRef, {
        replies: updatedReplies
      });
      setNewReply("");
      fetchComments();
    }
  };

  const handleKeyDown = (event, callback) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      callback();
    }
  };
  
  return (
    <div className="discussion-list">
      {comments.map((comment) => (
        <div key={comment.id} className="discussion-item">
          <div className="discussion-header">
            <span className="discussion-author">{comment.author}</span>
            <span className="discussion-timestamp">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
          </div>
          {editingCommentId === comment.id ? (
            <textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, () => handleEditComment(comment.id))}
            />
          ) : (
        <div className="comment-content">
            <div className="author-email">{comment.authorEmail}</div> {/* Отображение email */}
            <p>{comment.text}</p>
          </div>         
          )}
          <div className="discussion-actions">
            {editingCommentId === comment.id ? (
              <button onClick={() => handleEditComment(comment.id)}>Save</button>
            ) : (
              <>
                <IconButton onClick={() => { setEditingCommentId(comment.id); setEditComment(comment.text); }}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteComment(comment.id)}>
                  <DeleteIcon />
                </IconButton>
                <IconButton onClick={() => setReplyCommentId(comment.id)}>
                  <ReplyIcon />
                </IconButton>
              </>
            )}
            {comment.replies && comment.replies.map((reply, index) => (
              <div key={index} className="discussion-reply">
                <span className="reply-author">{reply.author}:</span>
                <span>{reply.text}</span>
                <span className="discussion-timestamp">
                  {new Date(reply.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
            {replyCommentId === comment.id && (
              <div>
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Type your reply here..."
                  onKeyDown={(e) => handleKeyDown(e, () => handleReply(comment.id))}
                />
                <IconButton onClick={() => handleReply(comment.id)}>
                  <SendIcon />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="new-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Leave a comment..."
          onKeyDown={(e) => handleKeyDown(e, handleAddComment)}
        />
        <button onClick={handleAddComment}>Post Comment</button>
      </div>
    </div>
  );

};

export default DiscussionList;
