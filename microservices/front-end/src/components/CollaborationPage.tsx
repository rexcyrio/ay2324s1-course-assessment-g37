import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import Quill, { TextChangeHandler } from "quill";
import classes from "./CollaborationPage.module.css";

function CollaborationPage() {
  const [text, setText] = useState<string>("");
  const [socket, setSocket] = useState<Socket>();
  const [quill, setQuill] = useState<Quill>();
  useEffect(() => {
    const socket = io("http://localhost:3111", { query: { roomId: "123" } });
    socket.on("connect", () => {
      console.log("connected");
    });
    socket.on("server code changes", (delta) => {
      setText(delta);
    });
    console.log("set");
    socket.on("other user has left", () => {
      console.log("left");
    });
    socket.on("room count", (count) => {
      console.log("room count", count);
    });
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    var editor = new Quill("#quill", {
      theme: "bubble",
    });

    const textChangeHandler: TextChangeHandler = (
      delta,
      oldContents,
      source
    ) => {
      if (source !== "user") return;
      socket.emit("client code changes", delta);
    };

    editor.on("text-change", textChangeHandler);
    socket.on("server code changes", (delta) => {
      editor.off("text-change", textChangeHandler);
      editor.updateContents(delta);
      editor.on("text-change", textChangeHandler);
    });
    setQuill(editor);
  }, [socket]);

  return (
    <div>
      <div id="quill" className={classes.quill} />
      {/* <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          socket!.emit("client code changes", e.target.value);
        }}
      /> */}
    </div>
  );
}

export default CollaborationPage;
