import React, { useRef } from "react";
import { useEffect, useState } from "react";
import { IoIosSend } from "react-icons/io";
import { FaRegUserCircle } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { RiRobot3Line } from "react-icons/ri";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { FaChevronCircleLeft } from "react-icons/fa";
// import { FaFileUpload } from "react-icons/fa";
import { FaChevronCircleRight } from "react-icons/fa";
// import { TiDeleteOutline } from "react-icons/ti";
import "./style.css";
import { GiMeshBall } from "react-icons/gi";
import { v4 as uuidv4 } from "uuid";

import { useNavigate } from "react-router-dom";

const ChatBot = () => {
  const [query, setQuery] = useState(""); //Nhận tin nhắn người dùng
  const [streamData, setStreamData] = useState(""); //Sử dụng để nhận tin nhắn trả về từ api
  const [message, setMessage] = useState([]);
  const [userID, setUserID] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [threadId,setThreadID] = useState("")
  const [isSearchWeb, setIsSearchWeb] = useState(false);
  const [URLFile, setURLFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };
  const urlBot = "https://contractprocess-bpeag9aad0c6a7du.southeastasia-01.azurewebsites.net"

  // Get response of conversation chat
  const handleSubmit = async (event, suggestedOpen) => {
    event.preventDefault(); // Ngăn reload trang
    setStreamData(""); // Reset dữ liệu stream
    setIsLoading(true);
  
    const url = `${urlBot}/chat`;
    const requestData = {
      query: query,
      thread_id: threadId, // threadId từ state
      user_id: userID,    // userID từ state hoặc context
    };
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      if (!response.body) {
        console.error("No response body");
        return;
      }
  
      // Lấy thread_id từ header
      const threadIDFromHeader = response.headers.get("X-Thread-ID");
      console.log("Thread ID from header:", threadIDFromHeader);
      setThreadID(threadIDFromHeader); // Cập nhật state threadId
  
      // Đọc stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let isFirstChunk = true; // Để xử lý dòng đầu tiên
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Kết thúc khi stream hoàn tất
  
        const chunk = decoder.decode(value, { stream: true });
  
        if (isFirstChunk) {
          // Xử lý dòng đầu tiên (JSON chứa thread_id)
          try {
            const firstLine = chunk.split("\n")[0]; // Lấy dòng đầu
            const jsonData = JSON.parse(firstLine);
            const threadIdFromBody = jsonData.thread_id;
            console.log("Thread ID from body:", threadIdFromBody);
            // Nếu cần so sánh hoặc dùng thread_id từ body, làm ở đây
            setStreamData(chunk.substring(firstLine.length + 1)); // Bỏ dòng đầu
          } catch (e) {
            console.error("Error parsing first chunk:", e);
            setStreamData(chunk); // Nếu không parse được, dùng chunk như bình thường
          }
          isFirstChunk = false;
        } else {
          // Cập nhật streamData với từng chunk
          setStreamData((prev) => prev + chunk);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setStreamData("Đã xảy ra lỗi khi xử lý yêu cầu.");
    } finally {
      setIsLoading(false);
      setURLFile("");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !isLoading) {
      handleSubmit(event, "");
      // console.log(imageFileSend);

      setMessage((prevMess) => [
        ...prevMess,
        { user: query, urlImages: URLFile || "" },
      ]);
      setQuery("");
    }
  };

  useEffect(() => {
    // Cập nhật tin nhắn với thông tin mới
    setMessage((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      // Cập nhật thuộc tính "bot" của đối tượng cuối cùng
      if (lastMessage && lastMessage.user) {
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          bot: streamData,
        };
      }

      return updatedMessages;
    });
  }, [streamData]);

  useEffect(() => {
    const userId = uuidv4();
    setUserID(userId);
  }, []);

  const handleNewChat = () => {
    setMessage([]); // Đặt lại state thành mảng rỗng để xóa các đoạn chat
    setThreadID("")
  };
  const handleSearchWeb = () => {
    setThreadID("")
    setIsSearchWeb(!isSearchWeb)
  }
  const handleManageFile = () => {
    navigate("/bot-management");
  };
  const handleCompareContract = () => {
    navigate("/compare-contract")
  }
  const handleManageClause = () => {
    navigate("/manage-clause")
  }
  return (
    <>
      <div className="flex h-screen">
        <div
          className={`${
            isCollapsed ? "w-2" : "w-1/5"
          } bg-white border-r border-gray-200 overflow-y-auto`}
        >
          <div
            className={`p-2 fixed ${
              isCollapsed ? "w-2" : "w-1/5"
            } bg-white flex items-center justify-center`}
          >
            <img
              src="/logo/icons8-chat-gpt-64.png"
              alt="Chatbot icon"
              className="rounded-full"
            />
            <div className="flex w-full justify-between">
              {isCollapsed ? (
                <span className="ml-2 text-xl font-semibold"></span>
              ) : (
                <span className="ml-2 text-xl font-semibold">CTX Bot</span>
              )}
              <button onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? (
                  <span className="text-3xl">
                    <FaChevronCircleRight />
                  </span>
                ) : (
                  <span className="text-3xl">
                    <FaChevronCircleLeft />
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="p-4 mt-20">
            <button
              className="w-full text-left p-2 flex gap-4 items-center text-xl hover:bg-gray-100 border border-2 border-blue-600 rounded-xl mb-2"
              onClick={handleManageFile}
            >
              Manage Bot File
            </button>
            <button
              className="w-full text-left p-2 flex gap-4 items-center text-xl hover:bg-gray-100 border border-2 border-blue-600 rounded-xl mb-2"
              onClick={handleNewChat}
            >
              <IoChatbubbleEllipsesOutline />
              New chat
            </button>
            <button
              className="w-full text-left p-2 flex gap-4 items-center text-xl hover:bg-gray-100 border border-2 border-blue-600 rounded-xl mb-2"
              onClick={handleCompareContract}
            >
              <IoChatbubbleEllipsesOutline />
              Compare Contract
            </button>
            <button
              className="w-full text-left p-2 flex gap-4 items-center text-xl hover:bg-gray-100 border border-2 border-blue-600 rounded-xl mb-2"
              onClick={handleManageClause}
            >
              <IoChatbubbleEllipsesOutline />
              Management Clause
            </button>
          </div>
        </div>
        <div
          className={`${isCollapsed ? "w-full" : "w-4/5"} mx-auto items-center`}
        >
          <div
            className={`flex flex-col ${
              isCollapsed ? "w-4/5" : "w-full"
            } h-screen mx-auto`}
          >
            <div className="flex-grow w-full mt-4 p-2 overflow-y-auto max-h-[90%]">
              <div className="flex flex-col gap-2 p-2">
                {message.map((mess, index) => (
                  <div key={index} className="flex flex-col">
                    {/* Hiển thị tin nhắn của người dùng */}

                    {mess.user && (
                      <div className="flex gap-1 self-end">
                        <div className=" bg-gray-200 text-right p-2 rounded-md max-w-[90%] ">
                          {mess.urlImages && (
                            <div
                              key={index}
                              className="flex relative justify-between border text-center w-full max-h-[70%] items-center px-2 py-1 rounded-md"
                            >
                              <img
                                src={mess.urlImages}
                                alt=""
                                className="max-w-64 max-h-56 object-contain mt-2"
                              />
                              {/* {file.type.startsWith("image/") ? (
                                  <img
                                    src={imageUrls[indexPicture]}
                                    alt={file.name}
                                    className="max-w-64 max-h-56 object-contain mt-2"
                                  />
                                ) : (
                                  <div className="flex gap-2 items-center w-full min-h-full">
                                    <p className="text-2xl">
                                      <FaFileAlt />
                                    </p>
                                    <p className="truncate w-full">
                                      {file.name}
                                    </p>
                                  </div>
                                )} */}
                              <br />
                            </div>
                          )}

                          {mess.user}
                        </div>
                        <i className="text-4xl">
                          <FaRegUserCircle />
                        </i>
                      </div>
                    )}

                    {/* Hiển thị tin nhắn của bot */}
                    {mess.bot && (
                      <div className="flex gap-2 text-left p-2 rounded-md max-w-[90%] self-start">
                        <i className="text-4xl">
                          <RiRobot3Line />
                        </i>
                        <div>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              table: ({ node, ...props }) => (
                                <table className="markdown-table" {...props} />
                              ),
                            }}
                          >
                            {mess.bot}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
                {isLoading && (
                  <div className="flex gap-2 text-left p-2 rounded-md max-w-[90%] self-start">
                    <i className="text-4xl">
                      <RiRobot3Line />
                    </i>
                    <div className="ml-2 flex space-x-2 text-3xl">
                      <span className="animate-bounce delay-0">.</span>
                      <span className="animate-bounce delay-150">.</span>
                      <span className="animate-bounce delay-300">.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex items-center">
              <div className="mr-[-35px] z-50">
                <button
                  className={`p-2 rounded-full ${isSearchWeb ? "bg-blue-200" : "bg-gray-200"}`}
                  // disabled={isUploading || !query.trim()}
                  disabled={isLoading}
                >
                  <i>
                    <GiMeshBall onClick={handleSearchWeb}/>
                  </i>
                </button>
              </div>
              <div className="max-w-4/5 border border-black flex flex-grow p-2 rounded-lg">

                <input
                  type="text"
                  className="flex-grow p-2 rounded-lg max-w-4/5 ml-8 outline-none "
                  placeholder=""
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {/* <div className="ml-2 text-3xl items-center text-blue-400 hover:text-blue-600">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FaFileUpload />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleOnChangeFile}
                />
              </div> */}
              <div className="ml-[-40px]">
                <button
                  className="p-2 rounded-full bg-gray-200"
                  // disabled={isUploading || !query.trim()}
                  disabled={isLoading}
                >
                  <i>
                    <IoIosSend onKeyDown={handleKeyDown} />
                  </i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
