import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoPencil } from "react-icons/go";
import { MdDeleteOutline } from "react-icons/md";
import { IoCloseCircleOutline } from "react-icons/io5";
import "./style.css";
import { FaUpload } from "react-icons/fa";
const ManagementClauseSample = () => {
  const urlProcess = "https://chatcontractprocess-hdh0ckfgh4cdbtf6.southeastasia-01.azurewebsites.net"
  // const urlProcess = "http://127.0.0.1:8003";

  const [clause, setClause] = useState([]);
  const [onClose, setOnClose] = useState(false);
  const [onCloseTemplate, setOnCloseTemplate] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [template, setTemplate] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [dataTemplate, setDataTemplate] = useState({
    template_name: "",
    file: [],
  });
  const [updateClause, setUpadateClause] = useState({
    id_template: "",
    heading: "",
    content: [],
  });
  const [clauseToDelete, setClauseToDelete] = useState({
    heading: "",
    content: [],
  });
  const [clauseChange, setClauseChange] = useState({
    heading: "",
    content: [],
  });
  const navigate = useNavigate();
  const getClauseData = async () => {
    try {
      const response = await fetch(`${urlProcess}/get-clause-sample`, {
        method: "POST",
        body: JSON.stringify({
          id_template: selectedTemplate,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log(result);

      setClause(result);
    } catch (error) {
      console.log(error);
    }
  };
  const handleGetTemplate = async () => {
    try {
      const response = await fetch(`${urlProcess}/get-items-standard`, {
        method: "GET",
      });
      const result = await response.json();
      setSelectedTemplate(result[0]);
      setTemplate(result);
    } catch (error) {
      console.log("Have error", error);
    }
  };
  const handleChange = (event) => {
    setSelectedTemplate(event.target.value);
  };
  const handleUploadFileToStorage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const sanitizedTemplateName = dataTemplate.template_name
      .toLowerCase()
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, "");
    formData.append("template_name", sanitizedTemplateName);
    dataTemplate.file.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const response = await fetch(`${urlProcess}/add-new-template`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData || "Lỗi không xác định từ API");
      }
      const resultData = await response.json();
      alert(resultData);
    } catch (error) {
      console.log(error);
    } finally {
      setOnCloseTemplate(!onCloseTemplate);
      setDataTemplate({
        template_name: "",
        file: [],
      });
      getClauseData()
    }
  };
  const handleHeadingChange = (e) => {
    setUpadateClause((prev) => ({
      ...prev,
      heading: e.target.value,
    }));
  };

  const handleHeadingChangeTemplate = (e) => {
    setDataTemplate((prev) => ({
      ...prev,
      template_name: e.target.value,
    }));
  };
  const handleDeleteProductImage = (index) => {
    const newProductImage = [...dataTemplate.file];
    newProductImage.splice(index, 1);
    setDataTemplate((prevData) => ({
      ...prevData,
      file: newProductImage,
    }));
  };
  const handleUploadFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      // eslint-disable-next-line
      setDataTemplate((prevData) => ({
        ...prevData,
        file: [...prevData.file, file],
      }));
    }
  };
  const handleUpdateClause = async (e) => {
    e.preventDefault();
    try {
      const reponse = await fetch(`${urlProcess}/add-new-clause`, {
        method: "POST",
        header: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_template: selectedTemplate,
          template: selectedTemplate,
          heading: updateClause.heading,
          content: updateClause.content
        }),
      });

      if (!reponse.ok) throw new Error("Failed to add clause");

      alert("Clause added successfully!");
      getClauseData();
    } catch (error) {
      console.log(error);
    } finally {
      setOpenUpdate(!openUpdate);
    }
  };
  const openDeleteDialog = (heading, content) => {
    setClauseToDelete({
      heading: heading,
      content: Array.isArray(content) ? content.join("\n") : content,
    });
    setOpenDelete(true);
  };
  const handleUpdateClauseFixing = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${urlProcess}/update-clause`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          id_template: selectedTemplate,
          heading: clauseChange.heading,
          content: clauseChange.content.includes("\n")
            ? clauseChange.content.split("\n")
            : [clauseChange.content], // Chuyển lại thành mảng nếu cần
        }),
      });

      const result = await response.json();
      console.log(result);
      alert("Chỉnh sửa điều khoản thành công!");
    } catch (error) {
      console.log(error);
    } finally {
      setOpenUpdate(false);
      getClauseData();
    }
  };
  const handleDeleteClause = async (e) => {
    e.preventDefault();
    try {
      const reponse = await fetch(`${urlProcess}/delete-clause`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_template: selectedTemplate,
          heading: clauseToDelete.heading,
          content: clauseToDelete.content.includes("\n")
            ? clauseToDelete.content.split("\n")
            : [clauseToDelete.content], // Chuyển lại thành mảng nếu cần
        }),
      });
      if (!reponse.ok) {
        throw new Error(`HTTP error! Status: ${reponse.status}`);
      }

      const data = await reponse.json(); // Chờ lấy JSON
      console.log("Delete response:", data);

      alert("Clause deleted successfully!");
    } catch (error) {
      console.log(error);
    } finally {
      setOpenDelete(false);
      getClauseData();
    }
  };
  const handContentChange = (e) => {
    const lines = e.target.value
      .split("\n")
      .filter((line) => line.trim() !== "");
    setUpadateClause((prev) => ({
      ...prev,
      content: lines,
    }));
  };
  const handleUploadFileClose = () => {
    setOpenDelete(false);
    setClauseToDelete({
      heading: "",
      content: [],
    });
  };
  const handleFixingClause = (heading, content) => {
    console.log("Content: ", content);

    setClauseChange({
      heading: heading,
      content: Array.isArray(content) ? content.join("\n") : content,
    });
    setOpenUpdate(true);
  };

  useEffect(
    () => {
      const fetchData = async () => {
        try {
          await getClauseData();
        } catch (error) {
          console.error("Failed to fetch clause data:", error);
        }
      };
      fetchData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTemplate]
  );
  useEffect(() => {
    handleGetTemplate();
  }, []);
  console.log("Template: ", template);

  const handleBack = () => {
    navigate("/chatbot");
  };
  const handleToContract = () => {
    navigate("/manage-contract");
  };
  const handleToChatContract = () => {
    navigate("/chat-contract");
  };
  return (
    <div className="h-screen ">
      <div className="h-[8%] flex w-full mb-2">
        <button
          className="p-4 border w-52 bg-blue-300 rounded-lg mt-1 font-medium ml-2 hover:bg-blue-500 hover:text-white"
          onClick={handleBack}
        >
          Back to Chatbot
        </button>
        <div className="items-center text-4xl font-semibold flex w-full justify-center">
          <p>Manage Sample Clause</p>
        </div>
        <button
          className="p-4 border w-60 bg-blue-300 rounded-lg mt-1 font-medium ml-2 hover:bg-blue-500 hover:text-white"
          onClick={() => setOnCloseTemplate(true)}
        >
          Add Template Clause
        </button>
      </div>
      <div className="w-full h-[90.4vh] flex">
        <div className="w-[18%] min-h-full border rounded-md border-black mr-3 ml-1">
          <div className="w-[90%] bg-slate-200 rounded-md border-black border-2 m-3 h-[97%] flex flex-col">
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                            hover:cursor-pointer hover:bg-blue-300"
            >
              <div>
                <p>Management Clause</p>
              </div>
            </div>
            <div
              className="p-4 h-fit m-3 rounded-md border bg-white items-center border-black shadow-2xl font-semibold text-lg
                            hover:cursor-pointer hover:bg-blue-300"
              onClick={handleToContract}
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
          </div>
        </div>

        <div className="w-[80%] border rounded-sm flex-col items-center flex overflow-scroll border-black ">
          <div className="flex justify-between w-[80%]">
            <select
              className="p-2 mt-2 border border-md rounded-md cursor-pointer w-48 border-black"
              value={selectedTemplate}
              onChange={handleChange}
            >
              {template.length > 0 ? (
                template.map((container, index) => (
                  <option value={container} key={index}>
                    {container}
                  </option>
                ))
              ) : (
                <option value="">Don't have any template</option>
              )}
            </select>
            <button
              className="p-4 border w-60 bg-blue-300 rounded-lg mt-1 font-medium ml-2 hover:bg-blue-500 hover:text-white"
              onClick={() => setOnClose(true)}
            >
              Add New Clause
            </button>
          </div>
          <table className="m-2 w-[95%] border-collapse border-2 border-black bg-blue-200">
            <thead>
              <tr className="bg-blue-300">
                <th className="border-2 border-black py-2 px-4 w-80">
                  Heading
                </th>
                <th className="border-2 border-black py-2 px-4">Content</th>
                <th className="border-2 border-black py-2 px-4 ">Action</th>
              </tr>
            </thead>
            <tbody>
              {clause.length > 0 &&
                clause.map((item, index) => (
                  <tr key={index} className="border-b-2 border-black">
                    <td className="border-2 border-black p-2">
                      {item.heading}
                    </td>
                    <td className="border-2 border-black p-2">
                      {Array.isArray(item.content) ? (
                        item.content.map((text, i) => (
                          <p key={i} className="mb-2">
                            {text}
                          </p>
                        ))
                      ) : (
                        <p>{item.content}</p>
                      )}
                    </td>
                    <td className="flex text-2xl  justify-center items-center text-center gap-2">
                      <GoPencil
                        className="hover:cursor-pointer hover:text-green-700"
                        onClick={() =>
                          handleFixingClause(item.heading, item.content)
                        }
                      />
                      <MdDeleteOutline
                        className="hover:cursor-pointer hover:text-red-500"
                        onClick={() =>
                          openDeleteDialog(item.heading, item.content)
                        }
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {onCloseTemplate && (
        <div className="fixed w-full bg-slate-200 bg-opacity-75 h-full top-0 left-0 right-0 bottom-0 flex justify-center  items-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[70%] overflow-auto pb-2">
            <div className="flex justify-center items-center">
              <p className="text-2xl font-semibold">Add Template</p>
              <div
                className="w-fit ml-auto text-2xl hover:text-red-600 cursor-pointer"
                onClick={() => setOnCloseTemplate(false)}
              >
                <IoCloseCircleOutline />
              </div>
            </div>
            <form className="mt-4">
              <label className="text-lg">Name of Template</label>
              <input
                type="text"
                className={` p-2 h-10 w-full border-black border ${
                  isFocus ? "cursor-blink" : ""
                }`}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                value={dataTemplate.template_name}
                onChange={handleHeadingChangeTemplate}
                required
              />
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
                {dataTemplate &&
                dataTemplate?.file &&
                dataTemplate?.file.length > 0 ? (
                  dataTemplate.file?.map((file, index) => (
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
      {onClose && (
        <div className="fixed w-full bg-slate-200 bg-opacity-75 h-full top-0 left-0 right-0 bottom-0 flex justify-center  items-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[80%] overflow-auto pb-2">
            <div className="flex justify-center items-center">
              <p className="text-2xl font-semibold">Add New Clause</p>
              <div
                className="w-fit ml-auto text-2xl hover:text-red-600 cursor-pointer"
                onClick={() => setOnClose(false)}
              >
                <IoCloseCircleOutline />
              </div>
            </div>
            <form className="mt-4" onSubmit={handleUpdateClause}>
              <label className="text-lg">Name of Heading</label>
              <input
                type="text"
                className={` p-2 h-10 w-full border-black border ${
                  isFocus ? "cursor-blink" : ""
                }`}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                value={updateClause.heading}
                onChange={handleHeadingChange}
                required
              />
              {isFocus && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 animate-blink">
                  I
                </span>
              )}
              <div className="">
                <label className="text-lg">Content</label>
                <div
                  className="p-4 my-2 bg-slate-100 border-white rounded h-64 w-full flex justify-center items-center"
                  value={updateClause.content.join("\n")}
                  onChange={handContentChange}
                  required
                >
                  <textarea className="p-1 w-full h-full"></textarea>
                </div>
              </div>
              <div className="flex"></div>
              <div className=" w-full flex">
                <button className="p-4 mt-5 rounded-full bg-red-500 text-center justify-center mx-auto items-center h-16 text-xl text-white">
                  Upload Clause
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
                <p>
                  Bạn có muốn xóa điều khoản này không: {clauseToDelete.heading}
                  ?
                </p>
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
                  onClick={handleUploadFileClose}
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {openUpdate && (
        <div className="fixed w-full bg-slate-200 bg-opacity-75 h-full top-0 left-0 right-0 bottom-0 flex justify-center  items-center z-50">
          <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[80%] overflow-auto pb-2">
            <div className="flex justify-center items-center">
              <p className="text-2xl font-semibold">Edit Clause</p>
              <div
                className="w-fit ml-auto text-2xl hover:text-red-600 cursor-pointer"
                onClick={() => setOpenUpdate(false)}
              >
                <IoCloseCircleOutline />
              </div>
            </div>
            <form className="mt-4" onSubmit={handleUpdateClauseFixing}>
              <label className="text-lg">Heading</label>
              <input
                type="text"
                className={` p-2 h-10 w-full border-black border ${
                  isFocus ? "cursor-blink" : ""
                }`}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                value={clauseChange.heading}
                onChange={(e) => {
                  setClauseChange((prev) => ({
                    ...prev,
                    heading: e.target.value,
                  }));
                }}
                required
              />
              {isFocus && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 animate-blink">
                  I
                </span>
              )}
              <div className="">
                <label className="text-lg">Content</label>
                <div
                  className="p-4 my-2 bg-slate-100 border-white rounded h-64 w-full flex justify-center items-center"
                  required
                >
                  <textarea
                    className="p-1 w-full h-full"
                    value={clauseChange.content}
                    onChange={(e) =>
                      setClauseChange((prev) => ({
                        ...prev,
                        content: e.target.value, // Chuyển về mảng khi nhập
                      }))
                    }
                    required
                  ></textarea>
                </div>
              </div>
              <div className="flex"></div>
              <div className=" w-full flex">
                <button className="p-4 mt-5 rounded-full bg-red-500 text-center justify-center mx-auto items-center h-16 text-xl text-white">
                  Update Clause
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementClauseSample;
