function Event(props) {
  console.log(props);
    return (
      <div className="Event">
        <h1>אירוע {props.event.id}</h1>
      </div>
    );
  }
  export default Event;
  