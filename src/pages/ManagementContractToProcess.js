import React, { useEffect, useState } from "react";
import { FaCloudDownloadAlt, FaUpload } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ManagementContractToProcess = () => {
  const urlProcess = "https://compare-contract-prod-f7b8d3b4bxgga4a7.southeastasia-01.azurewebsites.net"
  // const urlProcess = "http://127.0.0.1:8003"
  const navigate = useNavigate();
  const [onClose, setOnClose] = useState(false);
  const [fileToDelete, setFileToDelete] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [dataBlob, setDataBlob] = useState([]);
  const [status, setStatus] = useState({});
  const [socket, setSocket] = useState(null);
  const [data, setData] = useState({
    files: [],
  });
  const handleToClause = () => {
    navigate("/manage-clause");
  };

  const openDeleteDialog = (fileName) => {
    setFileToDelete(fileName);
    setOpenDelete(true);
  };
  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      // eslint-disable-next-line
      setData((prevData) => ({
        ...prevData,
        files: [...prevData.files, file],
      }));
    }
  };
  const handleDeleteProductImage = (index) => {
    const newProductImage = [...data.files];
    newProductImage.splice(index, 1);
    setData((prevData) => ({
      ...prevData,
      files: newProductImage,
    }));
  };
  const handleUploadFileToStorage = async (e) => {
    e.preventDefault();
    setStatus({})
    if (data.files.length === 0) return;

    const fileName = data.files[0].name;
    setStatus((prev) => ({ ...prev, [fileName]: "Kết nối đến server..." }));

    const newSocket = new WebSocket(
      // `ws://127.0.0.1:8003/ws?file_id=${fileName}`
      `wss://chatcontractprocess-hdh0ckfgh4cdbtf6.southeastasia-01.azurewebsites.net/ws?file_id=${fileName}`
    );

    newSocket.onmessage = (event) => {
      console.log("Raw WebSocket data:", event.data);
      console.log(status);
      
      const data = JSON.parse(event.data);
      setStatus((prevStatus) => {
        console.log("🔄 Cập nhật trạng thái:", { ...prevStatus, [data.file_id]: data.status });
        return { ...prevStatus, [data.file_id]: data.status };
      });
      if (data.status === "Upload success...") {
        handleUploadFileClose();
        getBlobStorage();
      }
      if (data.status === "Hoàn Thành...") {
        newSocket.close(); // 🔹 Chỉ đóng WebSocket khi hoàn thành
      }
    };

    newSocket.onerror = (error) => {
      setStatus("Lỗi kết nối WebSocket");
      console.error("WebSocket Error:", error);
    };

    setSocket(newSocket);

    const formData = new FormData();
    data.files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(
        `${urlProcess}/processing-file-admin`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setOnClose(false)
      setData({ files: [] });
      toast.success(`Files uploaded successfully! ${result.doc_id}`);
    } catch (error) {
      setStatus("Upload thất bại");
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      getBlobStorage()
      // setStatus({})
    }
  };

  // Đóng WebSocket khi component unmount
  useEffect(() => {
    return () => {
      if (socket) socket.close();
    };
  }, [socket]);
  const getBlobStorage = async () => {
    try {
      const response = await fetch(`${urlProcess}/get-blob`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Đã xảy ra lỗi không xác định");
      }

      const data = await response.json();
      console.log(data);

      if (data.files && data.files.length > 0) {
        setDataBlob(data.files);
      } else {
        setDataBlob([]);
        toast.error("Không tìm thấy tệp nào");
      }
    } catch (error) {
      setDataBlob([]);
    }
  };
  const handleUploadClauseClose = () => {
    setOpenDelete(false);
    setFileToDelete("");
  };

  const handleUploadFileClose = () => {
    setOpenDelete(false);
    setFileToDelete("");
  };
  const handleDeleteClause = async () => {
    try {
      const response = await fetch(
        `${urlProcess}/delete-files?blob=${fileToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast.success(`Tệp ${fileToDelete} đã được xóa.`);
        // Refresh the file list
        setDataBlob(dataBlob.filter((file) => file !== fileToDelete));
      } else {
        toast.error(result.error || "Có lỗi xảy ra khi xóa tệp.");
      }
    } catch (error) {
      console.log(error);
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setOpenDelete(false);
      getBlobStorage();
      setFileToDelete("");
    }
  };
  const handleToChatContract = () => {
    navigate("/chat-contract")
  }
  const handleToCompareContract = () => {
    navigate("/compare-contract")
  }
  useEffect(() => {
    getBlobStorage();
  }, []);
  return (
    <div className="h-screen">
      <div className="h-[8%] flex w-full mb-2">
    
        <div className="items-center text-4xl font-semibold flex w-full justify-center">
          <p>Manage Contract Process</p>
        </div>
        <button
          className="p-4 border w-44 bg-blue-300 rounded-lg mt-1 font-medium ml-2 hover:bg-blue-500 hover:text-white"
          onClick={() => setOnClose(true)}
        >
          Add Contract
        </button>
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
            >
              <div>
                <p>Management Contract</p>
              </div>
            </div>
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                                    hover:cursor-pointer hover:bg-blue-300"
                                    onClick={handleToChatContract}
            >
              <div>
                <p>Chat Contract</p>
              </div>
            </div>
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                                    hover:cursor-pointer hover:bg-blue-300"
              onClick={handleToCompareContract}
            >
              <div>
                <p>Compare Two Contract</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[80%] border rounded-sm flex-col items-center flex overflow-scroll border-black ">
          <div className="w-full mt-4 overflow-auto max-h-[75vh] transition-all duration-300 ease-in-out">
            {dataBlob.length > 0 ? (
              dataBlob.map((fileName, index) => (
                <div
                  key={index}
                  className="flex justify-between bg-slate-200 p-4"
                >
                  <p>{fileName}</p>
                  <div className="flex gap-5">
                  <p>{status[fileName.replace("Admin/", "")]}</p>
                    <MdDelete
                      className="text-2xl cursor-pointer"
                      onClick={() => openDeleteDialog(fileName)}
                    />
                    <FaCloudDownloadAlt
                      className="text-2xl text-blue-400 cursor-pointer"
                      //  onClick={() => handleDownloadFile(fileName)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4">Không có tệp nào để hiển thị</p>
            )}
          </div>
        </div>
      </div>
      {onClose && (
        <div className="fixed w-full bg-slate-200 bg-opacity-75 h-full top-0 left-0 right-0 bottom-0 flex justify-center  items-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[70%] overflow-auto pb-2">
            <div className="flex justify-center items-center">
              <p className="text-2xl font-semibold">Add Document</p>
              <div
                className="w-fit ml-auto text-2xl hover:text-red-600 cursor-pointer"
                onClick={() => setOnClose(false)}
              >
                <IoCloseCircleOutline />
              </div>
            </div>
            <form className="mt-4">
              <div className="">
                <label className="text-lg">File upload</label>
                <div
                  className="p-4 my-2 bg-slate-100 border-white rounded h-36 w-full flex justify-center items-center"
                  required
                >
                  <label htmlFor="uploadImageInput">
                    <div className="text-slate-500 justify-center items-center flex-col flex gap-2 cursor-pointer">
                      <span className="text-5xl">
                        <FaUpload />
                      </span>
                      <p className="text-lg">Choose File To Upload</p>
                      <input
                        type="file"
                        id="uploadImageInput"
                        className="hidden"
                        onChange={handleUploadFile}
                      />
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex">
                {data && data?.files && data?.files.length > 0 ? (
                  data.files?.map((file, index) => (
                    <div className="relative group p-2">
                      <div className="bg-slate-100 border rounded-lg p-4">
                        {file.name}
                      </div>
                      <div>
                        <IoCloseCircleOutline
                          className="top-0 right-0 absolute cursor-pointer bg-red-600 rounded-full text-white hidden group-hover:block"
                          onClick={() => handleDeleteProductImage(index)}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-red-500 text-xs">*Upload your file</div>
                )}
              </div>
              <div className=" w-full flex">
                <button
                  className="p-4 mt-5 rounded-full bg-red-500 text-center justify-center mx-auto items-center h-16 text-xl text-white"
                  onClick={handleUploadFileToStorage}
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {openDelete && (
        <div className="fixed w-full bg-slate-200 bg-opacity-75 h-full top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-xl h-full max-h-[40%] overflow-auto pb-2">
            <div className="flex justify-center items-center">
              <p className="text-2xl font-semibold">Delete Document</p>
              <div
                className="w-fit ml-auto text-2xl hover:text-red-600 cursor-pointer"
                onClick={handleUploadFileClose}
              >
                <IoCloseCircleOutline />
              </div>
            </div>
            <div className="flex flex-col gap-y-6 pt-10">
              <div className="w-full justify-center items-center font-semibold text-2xl text-center">
                <p>Bạn có muốn xóa tệp này không: {fileToDelete}?</p>
              </div>
              <div className="flex gap-10 w-full justify-center items-center">
                <button
                  className="px-8 py-4 bg-red-500 text-white rounded-md"
                  onClick={handleDeleteClause}
                >
                  YES
                </button>
                <button
                  className="px-8 py-4 bg-slate-500 text-white rounded-md"
                  onClick={handleUploadClauseClose}
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementContractToProcess;
