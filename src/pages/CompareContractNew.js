import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import RenderDocumentOverlay from "../compoments/RenderDocumentOverlay";
import ResponseClause from "../compoments/ResponseClause";
import { BsChatRightFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
const CompareContractNew = () => {
  const url_compare = "https://compare-contract-prod-f7b8d3b4bxgga4a7.southeastasia-01.azurewebsites.net"
  // const url_compare = "http://127.0.0.1:8003";
  const navigate = useNavigate();
  const [content,setContent] = useState(null)
  const [dataOriginal, setDataOriginal] = useState(null);
  const [dataModifile, setDataModifile] = useState(null);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dataFile, setDataFile] = useState([
    {
      content: "",
      polygon: [],
      page: 0,
    },
  ]);
  const [dataFile_2, setDataFile_2] = useState([
    {
      content: "",
      polygon: [],
      page: 0,
    },
  ]);
  const [highlightTextOriginal, setHighlightTextOriginal] = useState([]);
  const [highlightTextModifield, setHighlightTextModifield] = useState([]);
  const [pageWidth, setPageWidth] = useState(0);
  // eslint-disable-next-line
  const [pageHeight, setPageHeight] = useState(0);

  const handleFileStandardUploadOriginal = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tag", "original_file");
    const label = document.getElementById("labelOriginal");
    label.style.display = "none";

    const response = await fetch(`${url_compare}/covert-file-and-compare`, {
      method: "POST",
      body: formData,
    });

    const result_process = await response.json();
    const result_parse = JSON.parse(result_process.result);
    console.log(result_parse);

    setDataOriginal(result_parse);
  };
  const handleFileStandardUploadModifile = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tag", "modifile_file");
    const label = document.getElementById("labelModifile");
    label.style.display = "none";
    const response = await fetch(`${url_compare}/covert-file-and-compare`, {
      method: "POST",
      body: formData,
    });

    const result_process = await response.json();
    const result_parse = JSON.parse(result_process.result);
    console.log(JSON.parse(result_process.result));

    setDataModifile(result_parse);
  };
  const handleOpenChatBlock = () => {
    if(content !== null) {
      const isOpenBlock = !isOpen;
    setIsOpen(isOpenBlock);
    }
  };
  const extractParagraphData = (fileData) => {
    if (!fileData) return { data: [], width: 0, height: 0 };

    const data = [];

    for (let i = 0; i < fileData.paragraphs?.length || 0; i++) {
      const paragraph = fileData.paragraphs[i];
      if (paragraph.boundingRegions?.length > 0) {
        paragraph.boundingRegions.forEach((region) => {
          data.push({
            content: paragraph.content,
            polygon: region.polygon,
            page: region.pageNumber,
          });
        });
      }
    }

    return {
      data,
      width: fileData.pages?.[0]?.width || 0,
      height: fileData.pages?.[0]?.height || 0,
    };
  };

  

  const getTextHighlight = (compare_clause) => {
    const textHighlightOriginalResponse = [];
    const textHighlightModifieldResponse = [];
    for (let i = 0; i < compare_clause.length; i++) {
      if (compare_clause[i].tag === "replace") {
        const detailed_diff = compare_clause[i].detailed_diff;
        for (let j = 0; j < detailed_diff.length; j++) {
          const removed = detailed_diff[j].removed;
          const added = detailed_diff[j].added;

          if (Array.isArray(removed) && removed.length > 0) {
            textHighlightOriginalResponse.push(...removed);
          }

          if (Array.isArray(added) && added.length > 0) {
            textHighlightModifieldResponse.push(...added);
          }
        }
      }
      if (compare_clause[i].tag === "insert") {
        const modifield_text = compare_clause[i].modified_content;
        for (let j = 0; j < modifield_text.length; j++) {
          // textHighlightModifieldResponse.push(...modifield_text[j])
          textHighlightModifieldResponse.push(...modifield_text);
        }
      }
      if (compare_clause[i].tag === "delete") {
        const original_text = compare_clause[i].original_content;

        for (let j = 0; j < original_text.length; j++) {
          // textHighlightModifieldResponse.push(...modifield_text[j])
          textHighlightOriginalResponse.push(...original_text);
        }
      }
    }

    setHighlightTextModifield(textHighlightModifieldResponse);
    setHighlightTextOriginal(textHighlightOriginalResponse);
  };
  const handleCompareContract = async() => {
    try {
      const response = await fetch(`${url_compare}/compare-two-contract`, {
        method: "GET"
      })
      const result = await response.json()
      console.log(result.result_compare);
      getTextHighlight(result.result_compare);
      console.log();
      
    } catch (error) {
      toast.error(error)
    }
  }
  useEffect(() => {
    if (dataOriginal || dataModifile) {
      if (dataOriginal) {
        const { data, width, height } = extractParagraphData(dataOriginal);
        setDataFile(data);
        setPageWidth(width);
        setPageHeight(height);
      }
      if (dataModifile) {
        // eslint-disable-next-line
        const { data, width, height } = extractParagraphData(dataModifile);
        setDataFile_2(data);
      }
    }

    if(dataOriginal && dataModifile) {
      setIsButtonEnabled(true)
    } else {
      setIsButtonEnabled(false)
    }
    
    // eslint-disable-next-line
  }, [dataOriginal, dataModifile]);
  const getCommentClause = async() => {
    try {
      const response = await fetch(`${url_compare}/get-comment-clause`,{
        method: "GET"
      })
      const result = await response.json()
      console.log(result.result_comment);
      
      setContent(result.result_comment)
    } catch (error) {
      console.log(error);
    }
  }
    useEffect(() => {
      getCommentClause()
    }, [highlightTextOriginal]);
  const handleToClause = () => {
    navigate("/manage-clause");
  };

  return (
    <>
    <div className="h-[8%] w-full">
        <button
          className="p-3 border bg-blue-300 rounded-lg mt-1 font-medium ml-2 hover:bg-blue-500 hover:text-white"
          onClick={handleToClause}
        >
          Back to Chatbot
        </button>
      </div>
      <div className="w-full mb-4 flex justify-between mt-4">
        <div className=" ml-10 flex flex-col">
          <input
            type="file"
            id="fileOriginal"
            onChange={handleFileStandardUploadOriginal}
          />
          <label htmlFor="fileOriginal" id="labelOriginal" className="ml-2">
            Vui lòng chọn file gốc
          </label>
          
          <div
            id="text-layer2"
            className="relative top-[40px] left-0 w-full h-full"
          ></div>
        </div>
        <button
            className={`px-6 py-3 text-xl font-bold justify-center items-center border border-black rounded-md ${
              isButtonEnabled
                ? "hover:bg-blue-500 hover:text-white bg-[#6f91ff] cursor-pointer"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            onClick={handleCompareContract}
            disabled={!isButtonEnabled}
          >
            Compare
          </button>
        <div className="flex flex-col">
          <input
            type="file"
            id="fileModifile"
            onChange={handleFileStandardUploadModifile}
          />
          <label htmlFor="fileModifile" className="ml-2" id="labelModifile">
            Vui lòng chọn file chỉnh sửa
          </label>
        </div>
      </div>
      <div className="w-full min-h-[120vh] h-full flex gap-x-8 justify-center">
        <div className="w-[60%] bg-white">
          <RenderDocumentOverlay
            dataFile={dataFile}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            dataHighlight={highlightTextOriginal}
          />
        </div>
        <div className="w-[60%] bg-red-200">
          <RenderDocumentOverlay
            dataFile={dataFile_2}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            dataHighlight={highlightTextModifield}
          />
        </div>
        <div className="hover:cursor-pointer">
                <BsChatRightFill
                  className="fixed z-50 bottom-5 text-red-500 right-3 text-3xl"
                  onClick={handleOpenChatBlock}
                />
              </div>
      </div>
      {isOpen ? (
        <ResponseClause content={content}/>
      ) : (
        <div></div>
      )}
    </>
  );
};

export default CompareContractNew;
