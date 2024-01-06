import { useCallback, useState } from "react";
import { useListState } from "@mantine/hooks";
import {
  StompSessionProvider,
  useSubscription,
  IMessage,
  useStompClient
} from "react-stomp-hooks";
import moment, { Moment } from "moment";
import CONSTANTS from "../../utils/constants";
import { IconCheck, IconLoader, IconSend } from "@tabler/icons-react";
import "./style.scss";

interface ChatMessageMetaData {
  createdBy: string;
  createdAt: string | Moment;
  receivedAt: string | Moment;
  readAt: string | Moment;
}

interface ChatMessage {
  metaData: ChatMessageMetaData;
  content: string;
  chatId: number;
}

interface Chat {
  id: string;
}

export const ChatPage = () => {
  const [chatCtx, setChatCtx] = useState<Chat>();

  return (
    //Initialize Stomp connection, will use SockJS for http(s) and WebSocket for ws(s)
    //The Connection can be used by all child components via the hooks or hocs.
    <StompSessionProvider
      url={"ws:/localhost:8080/chat"}
    //All options supported by @stomp/stompjs can be used here
    >
      <SubscribingComponent />
    </StompSessionProvider>
  );
};

const testData = [
  { metaData: { createdAt: moment(), createdBy: "Oliver", readAt: moment(), receivedAt: moment() }, chatId: 1, content: "sample message" },
  { metaData: { createdAt: moment(), createdBy: "Oliver", readAt: moment(), receivedAt: moment() }, chatId: 1, content: "sample message" },
  { metaData: { createdAt: moment(), createdBy: "Oliver", readAt: moment(), receivedAt: moment() }, chatId: 1, content: "sample message" },
  { metaData: { createdAt: moment(), createdBy: "Oliver", readAt: moment(), receivedAt: moment() }, chatId: 1, content: "sample message" },
  { metaData: { createdAt: moment(), createdBy: "Oliver", readAt: moment(), receivedAt: moment() }, chatId: 1, content: "sample message" },
  { metaData: { createdAt: moment(), createdBy: "Oliver", readAt: moment(), receivedAt: moment() }, chatId: 1, content: "sample message" }
];

const sendUrl = "/app/message";
const receiveUrl = "/topic/message";

function SubscribingComponent() {
  const [username, setUsername] = useState<string>(`User ${Math.round(Math.random() * 1000)}`);
  const [tempMessageText, setTempMessageText] = useState<string>("");
  const [allMessages, allMessagesHandler] = useListState<ChatMessage>([]);
  const [lastMessage, setLastMessage] = useState<ChatMessage>();
  const stompClient = useStompClient();

  const messageHandler = useCallback((message: IMessage) => {
    console.log(message);
    const mText = JSON.parse(message.body);
    setLastMessage(mText);
    allMessagesHandler.append(mText);
    setTempMessageText("");
  }, [allMessagesHandler]);

  const sendMessageHandler = useCallback(() => {
    if (!tempMessageText) return;
    const momentNowString = moment().format(CONSTANTS.ZULU_TIMESTAMP_FORMAT);
    const chatMessage: ChatMessage = {
      metaData: {
        createdAt: momentNowString,
        createdBy: username ?? "unknown",
        readAt: momentNowString,
        receivedAt: momentNowString
      },
      chatId: 1,
      content: tempMessageText ?? "unknown"
    };

    if (stompClient) {
      //Send Message
      stompClient.publish({
        destination: sendUrl,
        body: JSON.stringify(chatMessage)
      });
    }
    else {
      //Handle error
    }
  }, [stompClient, tempMessageText, username]);

  useSubscription(receiveUrl, (message) => { messageHandler(message); });

  return (
    <div className="wst-chat">
      <div className="wst-chat__header">
        <input placeholder="username" value={username} onChange={(e) => { setUsername(e.target.value); }} />
      </div>
      <div className="wst-chat__content">
        {allMessages.map((m, i) => {
          const isMessageLoaded = true;
          const isBySelf = m.metaData.createdBy === username;
          return <div className={`wst-chat__message wst-chat__message--${isBySelf ? "me" : "other"}`} key={i}>
            <div className="wst-chat__message__header">
              <span>{m.metaData.createdBy}</span>
              <span>{moment(m.metaData.createdAt).format(CONSTANTS.DEFAULT_TIMESTAMP)}</span>
            </div>
            <div className="wst-chat__message__body">
              {m.content}
            </div>
            <div className="wst-chat__message__footer">
              {isMessageLoaded ? <IconCheck /> : <IconLoader />}
            </div>
          </div>;
        })}
      </div>
      <form className="wst-chat__actions" onSubmit={(e) => { sendMessageHandler(); e.preventDefault(); }}>
        <input placeholder="send message..." defaultValue="" value={tempMessageText} onChange={(e) => { setTempMessageText(e.target.value); }} />
        <button autoFocus>
          <IconSend size={28} />
        </button>
      </form>
    </div>
  );
}