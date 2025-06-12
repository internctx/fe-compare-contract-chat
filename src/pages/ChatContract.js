import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaFileAlt, FaFileUpload, } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { RiRobot3Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { v4 as uuidv4 } from "uuid";
import "./style.css";
import { TiDeleteOutline } from "react-icons/ti";
import { MdOutlineCleaningServices } from "react-icons/md";
import { toast } from "react-toastify";
const ChatContract = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState([]);
  const [query, setQuery] = useState("");
  const chatEndRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [userID, setUserID] = useState("");
  const [startNew, setStartNew] = useState(true);
  const [result, setResult] = useState("");
  const [dataDocument, setDataDocument] = useState([]);
  const [message, setMessage] = useState([]);
  const [fileName, setFileName] = useState([]);
  const [URLFile, setURLFile] = useState("");
  const [dropdown, setDropDown] = useState(false);
  const [documentID,setDocumentID] = useState("")
  const [documentName,setDocumentName] = useState("")
  const urlProcess = "https://compare-contract-prod-f7b8d3b4bxgga4a7.southeastasia-01.azurewebsites.net"
  // const urlProcess = "http://127.0.0.1:8003"
  const EXPIRATIONS_EXTRA = 24;

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };
  const handleOnClick = () => {
    setMessage((prevMess) => [
      ...prevMess,
      { user: query, urlImages: URLFile || "" },
    ]);
    setQuery("");
    setFileName("");
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !isLoading) {
      getResponse(event, "");
      // console.log(imageFileSend);

      setMessage((prevMess) => [
        ...prevMess,
        { user: query, urlImages: URLFile || "" },
      ]);
      setQuery("");
      setFileName("");
    }
  };
  const handleOnChangeFile = async (e) => {
    const file = e.target.files[0];
    const selectedFiles = Array.from(e.target.files);
    setFile(selectedFiles);
    setIsUploading(true);
    if (file) {
      setFileName(selectedFiles);
      // setQuery((prev) => [...prev, `${file.name}`])

      const newImageUrls = selectedFiles.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : null
      );
      setImageUrls(newImageUrls);
      try {
        for (const file of selectedFiles) {
          try {
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error.message);
          }
        }
      } catch (error) {
        console.log("Error: ", error);
      } finally {
        setIsUploading(false);
      }
    }
  };
  const handleToClause = () => {
    navigate("/manage-clause");
  };
  // const handleBack = () => {
  //   navigate("/chatbot");
  // };
  const handleToManagementContract = () => {
    navigate("/manage-contract");
  };
  const handleDeleteFile = () => {
    setFileName([]);
  };

  const getResponse = async (event) => {
    event.preventDefault();
    setIsLoading(true); 
    
    try {
      const formData = new FormData();
      formData.append("user_id", userID);
      formData.append("query", query);
      formData.append("start_new", startNew);

      if (file && file.length > 0) {
        file.forEach((f) => formData.append("file", f));
      } else if (documentID) {
        formData.append("doc_id", documentID);
      }
      const response = await fetch(`${urlProcess}/chatbot-contract`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Lỗi không xác định từ API");
      }
      const resultData = await response.json();
      console.log(resultData);
      const allResponses = resultData.response.map(item => item.response).join('\n\n');
      setResult(allResponses);
      setDocumentID(resultData.doc_id)
    } catch (error) {
      console.log(error);
      toast.error("Xin hãy chọn hợp đồng mà bạn muốn hỏi")
    } finally {
      setIsLoading(false);
      setStartNew(false);
      setURLFile("");
      setFile([])
    }
  };

  const getDataComsos = useCallback( async () => {
    // e.preventDefault()
    try {
      const response = await fetch(`${urlProcess}/get-all-data/${userID}`, {
        method: "GET",
      });
      if (!response.ok) {
        console.log("Have the error");
      }
      const data = await response.json();
      setDataDocument(data.data);
    } catch (e) {
      console.log(e);
    }
  }, [userID])
  useEffect(() => {
    // Cập nhật tin nhắn với thông tin mới
    setMessage((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      // Cập nhật thuộc tính "bot" của đối tượng cuối cùng
      if (lastMessage && lastMessage.user) {
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          bot: result,
        };
      }

      return updatedMessages;
    });
  }, [result]);
  const handleClickChooseDocument = (data) =>{
    setDocumentID(data.id)
    setDocumentName(data.file_name.split("/")[1])
    setDropDown(false)
  }
  const handleToCompareTwoContract = () => {
    navigate("/compare-contract");
  };
  const handleNewChat = () => {
    setMessage([]);
    setStartNew(true);
    setDocumentName("")
    setDocumentID("")
  };
  useEffect(() => {
    getDataComsos();
  }, [getDataComsos]);
  useEffect(() => {
    const storedUserId = localStorage.getItem("userID");
    const storedTimeStamp = localStorage.getItem("userID_timestamp");

    const now = new Date().getDate();
    const expration_times = EXPIRATIONS_EXTRA * 60 * 60 * 1000;

    if (
      !storedUserId ||
      !storedTimeStamp ||
      now - storedTimeStamp > expration_times
    ) {
      const newUserID = uuidv4();
      localStorage.setItem("userID", newUserID);
      localStorage.setItem("userID_timestamp", now.toString());
      setUserID(newUserID);
    } else {
      setUserID(storedUserId);
    }
  }, []);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);
  return (
    <div className="h-screen">
      <div className="h-[8%] flex w-full mb-2">
        
        <div className="items-center text-4xl font-semibold flex w-full justify-center">
          <p>Manage Contract Process</p>
        </div>
        
        <div className="relative">
          <div
            className="p-2 border mr-4 mt-2 max-h-14 text-center flex hover:cursor-pointer items-center justify-center rounded-lg border-black font-semibold"
            onClick={() => setDropDown(!dropdown)}
          >
            
            <p className={`${documentName ? "text-md" : "text-xl"}`}>{documentName || "Contract"}</p>
          </div>

          {dropdown && (
           <ul className={`absolute h-48 overflow-y-auto mt-2 w-48 bg-white border 
            border-gray-300 shadow-lg rounded-lg 
            ${documentName ? "left-0" : "left-[-85px]"}`}>

              {dataDocument.length > 0 ? (
                dataDocument.map((data, index) => (
                  <li key={index} className="px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleClickChooseDocument(data)}
                  >
                    {data.file_name.split("/")[1]}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500">No File for you</li>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="w-full h-[90.4vh] flex">
        <div className="w-[18%] min-h-full border rounded-md border-black mr-3 ml-1">
          <div className="w-[90%] bg-slate-200 rounded-md border-black border-2 m-3 h-[97%] flex flex-col">
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                                          hover:cursor-pointer hover:bg-blue-300"
              onClick={handleToClause}
            >
              <div>
                <p>Management Clause</p>
              </div>
            </div>
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                                          hover:cursor-pointer hover:bg-blue-300"
              onClick={handleToManagementContract}
            >
              <div>
                <p>Management Contract</p>
              </div>
            </div>
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                                          hover:cursor-pointer hover:bg-blue-300"
            >
              <div>
                <p>Chat Two Contract</p>
              </div>
            </div>
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                                    hover:cursor-pointer hover:bg-blue-300"
              onClick={handleToCompareTwoContract}
            >
              <div>
                <p>Compare Contract</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[80%] border rounded-sm flex-col items-center flex overflow-scroll border-black ">
          <div className="flex-grow w-full mt-4 p-2 overflow-y-auto max-h-[90%]">
            <div className="flex flex-col gap-2 p-2">
              {message.map((mess, index) => (
                <div key={index} className="flex flex-col">
                  {/* Hiển thị tin nhắn của người dùng */}

                  {mess.user && (
                    <div className="flex gap-1 self-end">
                      <div className=" bg-gray-200 text-right p-2 rounded-md max-w-[90%] ">
                        {file.map((file, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {file.type.startsWith("image/") &&
                            imageUrls[index] ? (
                              <img
                                src={imageUrls[index]}
                                alt={file.name}
                                className="max-w-64 max-h-56 object-contain mt-2"
                              />
                            ) : (
                              <div className="flex gap-2 items-center w-full min-h-full">
                                <p className="text-2xl">
                                  <FaFileAlt />
                                </p>
                                <p className="truncate w-full">{file.name}</p>
                              </div>
                            )}
                          </div>
                        ))}

                        {mess.user}
                      </div>
                      {/* <i className="text-4xl">
                              <FaRegUserCircle />
                            </i> */}
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
              <div />
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
          <div className="p-4 border-t border-gray-200 flex items-center min-w-full">
            <div
              className="mr-3 p-2 rounded-full hover:bg-blue-400 hover:cursor-pointer hover:text-black bg-gray-400 text-white"
              onClick={handleNewChat}
            >
              <p className="text-3xl">
                <MdOutlineCleaningServices />
              </p>
            </div>
            <div className="w-full border border-black flex-grow p-2 rounded-lg">
              <div id="FILE NEF" className="">
                {fileName.length > 0 ? (
                  fileName.map((file, index) => (
                    <div
                      key={index}
                      className="flex relative justify-between border text-center max-w-56 max-h-20 items-center px-2 py-1 rounded-md border-black"
                    >
                      {isUploading && (
                        <div className="flex items-center justify-center z-50 w-[80%] bg-opacity-75 h-full absolute bg-gray-400">
                          <svg
                            className="animate-spin h-6 w-6 text-blue-700"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-35"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                        </div>
                      )}
                      {file.type.startsWith("image/") ? (
                        <img
                          src={imageUrls[index]}
                          alt={file.name}
                          className="max-w-24 max-h-24 object-contain mt-2"
                        />
                      ) : (
                        <div className="flex gap-2 items-center w-full min-h-full">
                          <p className="text-2xl">
                            <FaFileAlt />
                          </p>
                          <p className="truncate w-full">{file.name}</p>
                        </div>
                      )}
                      <div
                        className="w-fit cursor-pointer text-xl absolute top-0 right-0 hover:text-red-500"
                        onClick={handleDeleteFile}
                      >
                        <TiDeleteOutline />
                      </div>
                    </div>
                  ))
                ) : (
                  <div></div>
                )}
              </div>

              <input
                type="text"
                className="flex-grow p-2 rounded-lg w-full outline-none "
                placeholder=""
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="ml-[-34px] mr-3 text-3xl items-center text-blue-400 hover:text-blue-600">
              <label htmlFor="file-upload" className="cursor-pointer">
                <FaFileUpload />
              </label>
              <input
                id="file-upload"
                type="file"
                style={{ display: "none" }}
                onChange={handleOnChangeFile}
              />
            </div>
            <button
              className="ml-2 p-2 rounded-full bg-gray-200"
              // disabled={isUploading || !query.trim()}
            >
              <i>
                <IoIosSend onKeyDown={handleKeyDown} onClick={handleOnClick} />
              </i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContract;
