import React, { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import { FaChevronRight, FaUpload } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
const BotManagement = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [onClose, setOnClose] = useState(false);
  const [dataContainer, setDataContainer] = useState([]);
  const [data, setData] = useState({
    files: [],
  });
  const [dataBlob, setDataBlob] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState("");
  const handleChange = (event) => {
    setSelectedContainer(event.target.value);
  };
  const [openDelete, setOpenDelete] = useState(false);
  const [fileToDelete, setFileToDelete] = useState("");
  // const [fileToDownload, setFileToDownload] = useState("")
  const url = "https://contractprocess-bpeag9aad0c6a7du.southeastasia-01.azurewebsites.net"
  const handleLoadContainers = async () => {
    try {
      // Gọi API
      const response = await fetch(
        `${url}/get-all-container`,
        {
          method: "GET",
        }
      );

      // Kiểm tra nếu không có phản hồi thành công
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Chuyển dữ liệu phản hồi sang JSON
      const data = await response.json();
      console.log(data);
      

      if (data.container.length > 0) {
        setSelectedContainer(data.container[0]);
      }
      // Cập nhật state với dữ liệu container
      setDataContainer(Array.isArray(data.container) ? data.container : []);
    } catch (error) {
      // Xử lý lỗi khi gọi API hoặc cập nhật state
      console.error("Error fetching containers:", error.message);
    }
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
  const handleDeleteFile = async () => {
    if (!selectedContainer || !fileToDelete) return;

    try {
      const response = await fetch(`${url}/delete-files?container=${selectedContainer}&blob=${fileToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });

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
      setFileToDelete("");
    }
  };
  const handleDownloadFile = async (fileToDownload) => {
    if (!selectedContainer || !fileToDownload) return;
  
    try {
      const response = await fetch(
        `${url}/download-files?container=${selectedContainer}&blob=${fileToDownload}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
  
      const result = await response.json();
      
      if (response.ok) {
        const downloadLink = result; 
        console.log(downloadLink);
        // backend trả về link tại đây
        toast.success(`Tệp ${fileToDownload} đã được tải thành công.`);
        
        // Mở đường link để tải file
        window.open(downloadLink, '_blank');
  
        // Refresh the file list nếu cần
      } else {
        toast.error(result.error || "Có lỗi xảy ra khi download.");
      }
    } catch (error) {
      console.log(error);
      toast.error(`Lỗi: ${error.message}`);
    }
  };
  // Open delete confirmation dialog
  const openDeleteDialog = (fileName) => {
    setFileToDelete(fileName);
    setOpenDelete(true);
  };

  // Close delete confirmation dialog
  const handleUploadFileClose = () => {
    setOpenDelete(false);
    setFileToDelete("");
  };

 
  // upload file
  const handleUploadFileToStorage = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    data.files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("container_name", selectedContainer);

    try {
      const response = await fetch(
        `${url}/upload-file-document`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSelectedContainer("");
      setData({ files: [] });
      handleUploadFileClose();
      // Hiển thị thông báo thành công
      toast.success(`Files uploaded successfully! ${result.message}`);
    } catch (error) {
      // Hiển thị thông báo lỗi
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedContainer) {
        setDataBlob([]);
        return;
      }

      try {
        const response = await fetch(
          `${url}/get-blob?container=${selectedContainer}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Đã xảy ra lỗi không xác định");
        }

        const data = await response.json();
        
        
        if (data.files && data.files.length > 0) {
          setDataBlob(data.files);
        } else {
          setDataBlob([]);
        }
      } catch (error) {
        setDataBlob([]);
        console.log(error);

        toast.error(`Lỗi: ${error.message}`);
      }
    };
    fetchFiles();
  }, [selectedContainer]);

  useEffect(() => {
    handleLoadContainers();
  }, []);
  return (
    <div>
      <div className="bg-slate-200 h-[100vh]">
        <div >
        <Link to="/chatbot" className="underline text-blue-500">Back to Chatbot</Link>
        <p className="text-4xl font-semibold text-center">Bot Management</p>
        </div>
        <div className="mt-4 mx-2 shadow-2xl">
          <div className="p-4 bg-white shadow-md rounded-lg">
            <div className="flex justify-between items-center ">
              <p
                className="flex items-center gap-4 text-center text-2xl font-semibold cursor-pointer"
                onClick={toggleExpand}
              >
                Document {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </p>
              <select
                className="p-2 border border-md rounded-md cursor-pointer w-48 border-black"
                value={selectedContainer}
                onChange={handleChange}
              >
                <option value="">Choose Storage</option>
                {dataContainer.length > 0 ? (
                  dataContainer.map((container, index) => (
                    <option value={container} key={index}>
                      {container}
                    </option>
                  ))
                ) : (
                  <option value="">Don't have any containers</option>
                )}
              </select>
              <button
                className="p-4 border text-lg rounded-md bg-blue-400 text-white hover:bg-blue-600"
                onClick={() => setOnClose(true)}
              >
                Add Document
              </button>
            </div>

            <div
              className={`w-full mt-4 overflow-auto ${
                isExpanded ? "max-h-[75vh]" : "h-0"
              } transition-all duration-300 ease-in-out`}
            >
              {Array.isArray(dataBlob) && dataBlob.length > 0 ?  (
                dataBlob.map((fileName, index) => (
                  <div
                    key={index}
                    className="flex justify-between bg-slate-200 p-4"
                  >
                    <p>{fileName}</p>
                    <div className="flex gap-5">
                    <MdDelete
                      className="text-2xl cursor-pointer"
                      onClick={() => openDeleteDialog(fileName)}
                    />
                    <FaCloudDownloadAlt
                       className="text-2xl text-blue-400 cursor-pointer"
                       onClick={() => handleDownloadFile(fileName)}
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
      </div>
      {/* <ChatHistory/> */}
      {/* Add document */}
      {onClose && (
        <div className="fixed w-full bg-slate-200 bg-opacity-75 h-full top-0 left-0 right-0 bottom-0 flex justify-center  items-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[60%] overflow-auto pb-2">
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
              <label className="text-lg">Choose container to upload</label>
              <select
                className="p-2 border border-sm w-full border-black"
                value={selectedContainer}
                onChange={handleChange}
              >
                <option value="">Select Storage</option>
                {Array.isArray(dataContainer) && dataContainer.length > 0 ? (
                  dataContainer.map((container, index) => (
                    <option value={container} key={index}>
                      {container}
                    </option>
                  ))
                ) : (
                  <option value="">No containers available</option>
                )}
              </select>

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
                    <div key={index} className="relative group p-2">
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
                  onClick={handleDeleteFile}
                >
                  YES
                </button>
                <button
                  className="px-8 py-4 bg-slate-500 text-white rounded-md"
                  onClick={handleUploadFileClose}
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

export default BotManagement;