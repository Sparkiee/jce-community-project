import "../styles/Task.css";

function Task(props) {
  // console.log(props.task);
  console.log(props.task.id);
  return (
    <div className="task-box">
      <div className="task-field task-id">{props.task.id}</div>
      <div className="task-field task-title">{props.task.taskName}</div>
      <div className="task-field task-description">{props.task.taskDescription}</div>
      <div className="task-field task-dueDate">{props.task.taskDate}</div>
      <div className="task-field task-dueTime">{props.task.taskTime}</div>
      <div className="task-field task-status">{props.task.taskStatus}</div>
      <br />
    </div>
  );
}
export default Task;
