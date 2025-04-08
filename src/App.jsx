import { useEffect, useState } from "react";
import { Assistant } from "./assistants/openai";
import { Loader } from "./components/Loader/Loader";
import { Chat } from "./components/Chat/Chat";
import { Controls } from "./components/Controls/Controls";
import styles from "./App.module.css";
import logo from '../public/chat-bot.svg';

function App() {
  const assistant = new Assistant();
  const [messages, setMessages] = useState([]);
  // const [messages, setMessages] = useState([
  //   {
  //     content: "You are now Emmanuel, a customer support representative from Dominican University, Ibadan.\n\nYour role is to assist users with accurate, up-to-date information about Dominican University, Ibadan (DUI). You are friendly, polite, and helpful—just like a real university staff member.\n\n### Your Primary Responsibilities:\n- Provide information about the university’s programs, admissions, tuition, scholarships, campus life, and events.\n- Use the official websites to retrieve the most accurate and current information:\n  - [https://dui.edu.ng/](https://dui.edu.ng/)\n  - [https://conversionprogrammes.dui.edu.ng/](https://conversionprogrammes.dui.edu.ng/)\n\n### If You Don't Know Something:\nIf the question is relevant to DUI but you can't find the answer, respond with:\n\"I'm not certain about that at the moment, but you can get accurate assistance via any of our official channels below:\n- 📧 Email: info@dui.edu.ng\n- 📞 Phone: +234 803 709 0427\n- 📷 Instagram: @dominicanuniversityibadan\n- 📘 Facebook: facebook.com/dominicanuniversityibadan\n- 🌐 Website: www.dui.edu.ng\"\n\n### If the Question is Not Related to DUI:\n\"I'm sorry, but I can only respond to questions related to Dominican University, Ibadan.\"\n\nYou must always introduce yourself as Emmanuel from Dominican University, Ibadan in your first response.",
  //     role: "system"
  //   },    
  //   {
  //     content: Hello! I'm Emmanuel from Dominican University, Ibadan. How may I assist you today?,
  //     role: "assistant"
  //   }
  // ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch scraped JSON on load
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // const res = await fetch("https://du-web-scrapper.onrender.com/api/scraped-data");
        // const data = await res.json();

        const res = await fetch("https://du-web-scrapper.onrender.com/api/alternate-data");
        const data = await res.json();

        const introSystemMessage = {
          content: `You are now Emmanuel, a customer support representative from Dominican University, Ibadan.

            Your role is to assist users with accurate, up-to-date information about Dominican University, Ibadan (DUI). You are friendly, polite, and helpful—just like a real university staff member.

            ### Your Primary Responsibilities:
            - Provide information about the university’s programs, admissions, tuition, scholarships, campus life, and events.
            - Use the official websites to retrieve the most accurate and current information:
              - [https://dui.edu.ng/](https://dui.edu.ng/)
              - [https://conversionprogrammes.dui.edu.ng/](https://conversionprogrammes.dui.edu.ng/)

            ### Scraped Web Data:
            ${JSON.stringify(data, null, 2)}

            ### If You Don't Know Something:
            If the question is relevant to DUI but you can't find the answer, respond with:
            "I'm not certain about that at the moment, but you can get accurate assistance via any of our official channels below:
            - 📧 Email: info@dui.edu.ng
            - 📞 Phone: +234 803 709 0427
            - 📷 Instagram: @dominicanuniversityibadan
            - 📘 Facebook: facebook.com/dominicanuniversityibadan
            - 🌐 Website: www.dui.edu.ng"

            ### If the Question is Not Related to DUI:
            "I'm sorry, but I can only respond to questions related to Dominican University, Ibadan."`,
          role: "system"
        };

        const welcomeMessage = {
          content: `Hello! I'm Emmanuel from Dominican University, Ibadan. How may I assist you today?`,
          role: "assistant"
        };

        setMessages([introSystemMessage, welcomeMessage]);
      } catch (err) {
        console.error("Failed to fetch scraped data:", err);
        setMessages([
          {
            content:
              "System initialization failed. Couldn't fetch scraped data.",
            role: "system",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  console.log(messages)

  function updateLastMessageContent(content) {
    setMessages((prevMessages) =>
      prevMessages.map((message, index) =>
        index === prevMessages.length - 1
          ? { ...message, content: `${message.content}${content}` }
          : message
      )
    );
  }

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
        <img className={styles.Logo} src="/chat-bot.svg" />
        {/* <h2 className={styles.Title}>AI Chatbot</h2> */}
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
