import { FC, useEffect, useState } from "react";
import { useUserContext } from "../../UserContext";
import { Socket } from "socket.io-client";
import { get24HourTime } from "../../utility/get24HourTime";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

interface ChatProps {
  socket: Socket | undefined;
}

const Chat: FC<ChatProps> = ({ socket }) => {
  const { currentUser } = useUserContext();
  const [messages, setMessages] = useState<JSX.Element[]>([]);
  const [otherTyping, setOtherTyping] = useState<boolean>(false);

  const insertMessage = (
    text: string,
    time: string,
    name: string,
    direction: "incoming" | "outgoing"
  ) => {
    const newMessage = (
      <Message
        model={{
          message: text,
          sentTime: time,
          sender: name,
          direction: direction,
          position: "single",
        }}
      >
        <Message.Footer sender={name} sentTime={time} />
      </Message>
    );

    setMessages((curMessages) => {
      return [...curMessages, newMessage];
    });
  };

  const messageSendHandler = (
    innerHtml: string,
    _textContent: string,
    _innerText: string
  ) => {
    const currentTime = get24HourTime();
    const SELF_REFERENCE = "You";

    insertMessage(innerHtml, currentTime, SELF_REFERENCE, "outgoing");

    socket?.emit(
      "send message",
      innerHtml,
      currentTime,
      currentUser.displayName
    );

    socket?.emit("user stopped typing");
  };

  const typingHandler = () => {
    socket?.emit("user typing");
  };

  const stopTypingHandler = () => {
    socket?.emit("user stopped typing");
  };

  useEffect(() => {
    const onReceiveMessage = (
      text: string,
      time: string,
      displayName: string
    ): void => {
      insertMessage(text, time, displayName, "incoming");
    };

    socket?.on("receive message", onReceiveMessage);

    socket?.on("other person typing", () => {
      setOtherTyping(true);
    });

    socket?.on("other person stopped typing", () => {
      setOtherTyping(false);
    });

    const cleanup = () => {
      socket?.off("receive message", onReceiveMessage);
    };

    return cleanup;
  }, [socket]);

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <MainContainer>
        <ChatContainer>
          <MessageList
            typingIndicator={
              otherTyping && (
                <TypingIndicator content="other person is typing" />
              )
            }
          >
            {...messages}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            attachButton={false}
            onSend={messageSendHandler}
            onChange={typingHandler}
            onBlur={stopTypingHandler}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

export default Chat;
