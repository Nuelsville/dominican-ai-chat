import { useState } from "react";
import { Assistant } from "./assistants/openai";
import { Loader } from "./components/Loader/Loader";
import { Chat } from "./components/Chat/Chat";
import { Controls } from "./components/Controls/Controls";
import styles from "./App.module.css";

function App() {
  const assistant = new Assistant();
  const [messages, setMessages] = useState([
    {
      content: `You are now Emmanuel, a customer support representative from Dominican University, Ibadan.
        For the duration of this thread, you must stay in character and only respond to questions about Dominican University, Ibadan.
        If someone asks anything outside the scope of the university, respond with:
        “I'm sorry, but I can only respond to questions related to Dominican University, Ibadan.”
        If a question is related to the university but you do not have the answer, provide the official contact information, including:
        Email: info@dui.edu.ng
        Phone: +234 803 709 0427
        Instagram: @dominicanuniversityibadan
        Facebook: facebook.com/dominicanuniversityibadan
        Website: www.dui.edu.ng
        You should be polite, helpful, and respond as a friendly university staff member. You must introduce yourself as Emmanuel from Dominican University, Ibadan in your first message.`,
      role: "system"
    },
    {
      content: `Hello! I'm Emmanuel from Dominican University, Ibadan. How may I assist you today?`,
      role: "assistant"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  function updateLastMessageContent(content) {
    setMessages((prevMessages) =>
      prevMessages.map((message, index) =>
        index === prevMessages.length - 1
          ? { ...message, content: `${message.content}${content}` }
          : message
      )
    );
  }

  console.log(messages)

  function addMessage(message) {
    setMessages((prevMessages) => [...prevMessages, message]);
  }

  async function handleContentSend(content) {
    if (!content.trim()) return;
    addMessage({ content, role: "user" });
    setIsLoading(true);
    try {
      const result = await assistant.chatStream(content, messages);
      let isFirstChunk = false;

      for await (const chunk of result) {
        if (!isFirstChunk) {
          isFirstChunk = true;
          addMessage({ content: "", role: "assistant" });
          setIsLoading(false);
          setIsStreaming(true);
        }

        updateLastMessageContent(chunk);
      }

      setIsStreaming(false);
    } catch (error) {
      addMessage({
        content: "Sorry, I couldn't process your request. Please try again!",
        role: "system",
      });
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  return (
    <div className={styles.App}>
      {isLoading && <Loader />}
      <header className={styles.Header}>
        <img className={styles.Logo} src="/chat-bot.png" />
        <h2 className={styles.Title}>AI Chatbot</h2>
      </header>
      <div className={styles.ChatContainer}>
        <Chat messages={messages} />
      </div>
      <Controls
        isDisabled={isLoading || isStreaming}
        onSend={handleContentSend}
      />
    </div>
  );
}

export default App;
