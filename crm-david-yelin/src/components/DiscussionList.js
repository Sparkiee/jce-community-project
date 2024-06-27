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
} from "firebase/firestore";
import "../styles/Discussion.css";
import IconButton from "@mui/material/IconButton";
import ReplyIcon from "@mui/icons-material/Reply";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const DiscussionList = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [editComment, setEditComment] = useState("");
  const [expandedCommentId, setExpandedCommentId] = useState(null); // Состояние отслеживания для раскрытого коммента 


  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    const commentsList = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setComments(commentsList);
  };

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;
    await addDoc(collection(db, "comments"), {
      eventId,
      text: newComment,
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
    fetchComments();
  };

  const handleDeleteComment = async (commentId) => {
    const commentRef = doc(db, "comments", commentId);
    await deleteDoc(commentRef);
    fetchComments();
  };

  const handleReplyComment = (commentId) => {
    setReplyCommentId(commentId);
  };

  const handleShowFullDiscussion = (commentId) => {
    if (expandedCommentId === commentId) {
      setExpandedCommentId(null); // Если комментарий уже раскрыт, закрыть его
    } else {
      setExpandedCommentId(commentId); // Иначе раскрыть новый комментарий
    }
  };
  

  return (
    <div className="discussion-list">
      {comments.map((comment) => (
        <div key={comment.id} className="discussion-item">
          <div className="discussion-header">
            <span className="discussion-author">{comment.author}</span>
            <span className="discussion-timestamp">
              {new Date(comment.timestamp.toDate()).toLocaleString()}
            </span>
          </div>
          <div>
            {editingCommentId === comment.id ? (
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
            ) : (
              <p>{comment.text}</p>
            )}
            {expandedCommentId === comment.id && (
              <div className="full-discussion">
                <p>Additional details about the comment or related replies...</p>
              </div>
            )}
          </div>
          <div className="discussion-actions">
            <IconButton onClick={() => handleReplyComment(comment.id)}>
              <ReplyIcon />
            </IconButton>
            <IconButton onClick={() => setEditingCommentId(comment.id)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDeleteComment(comment.id)}>
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={() => handleShowFullDiscussion(comment.id)}>
              <ExpandMoreIcon />
            </IconButton>
          </div>
          {editingCommentId === comment.id && (
            <button onClick={() => handleEditComment(comment.id)}>
              Save Comment
            </button>
          )}
        </div>
      ))}
      <div className="new-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Leave a comment..."
        />
        <button onClick={handleAddComment}>Post Comment</button>
      </div>
    </div>
  );
};

export default DiscussionList;
