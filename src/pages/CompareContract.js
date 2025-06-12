import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./pdf.css";
import "./style.css";
import * as pdfjsLib from "pdfjs-dist";
import { v4 as uuidv4 } from "uuid";
import { BsChatRightFill } from "react-icons/bs";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
const CompareContract = () => {
  const [pdfStandard, setPDFStandard] = useState(null); // Quản lý tài liệu PDF
  const [pdfStandard2, setPDFStandard2] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
  const containerRef = useRef(null);
  const containerRef2 = useRef(null);
  const [diffPage, setDiffPage] = useState([]);
  const [resultCompare, setResultCompare] = useState([]);
  const [highlightData, setHighlightData] = useState({ file1: [], file2: [] });
  const [urlFile, setUrlFile] = useState("");
  const [urlFile2, setUrlFile2] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [userID, setUserID] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const navigate = useNavigate();
  let renderTask = null;
  let renderTask2 = null;

  const url = "https://compare-contract-prod-f7b8d3b4bxgga4a7.southeastasia-01.azurewebsites.net";
  // const url = "http://127.0.0.1:8001"
  const handleBack = () => {
    navigate("/chatbot");
  };
  
  const sanitizeEndWord = (word) => {
    return word.replace(/\s\.$/, "");
  };

  const getSearchKeywords = (searchText) => {
    const words = searchText.trim().split(/\s+/);
    const startWords = words.slice(0,3).join(" ");
    const endWords = sanitizeEndWord(words.slice(-3).join(" "));
    
    
    
    return { startWords, endWords };
  };
  const findDivsWithStartEnd = (sortedTextArray, startWords, endWords) => {
    let startDiv = null;
    let endDiv = null;
    let accumulatedText = "";
    let matchedDivs = [];
    const cleanStartWords = startWords.replace(/[“”]/g, '"').toLowerCase();
    sortedTextArray.forEach((item, index) => {
      let divText = item.str.replace(/\s+/g, " ").trim().toLowerCase();
      divText = divText.replace(/[“”]/g, '"');

      // Tìm startDiv
      if (!startDiv && divText.includes(cleanStartWords)) {
        startDiv = item;
        matchedDivs.push(item);
        accumulatedText = divText + " ";
        return; // Tiếp tục sau khi tìm được startDiv
      }

      // Sau khi tìm thấy startDiv, tích lũy văn bản để tìm endDiv
      if (startDiv && !endDiv) {
        matchedDivs.push(item);
        accumulatedText += divText + " ";

        if (accumulatedText.includes(endWords.toLowerCase())) {
          endDiv = item;
          return; // Dừng lại khi đã tìm thấy endWords
        }
      }
    });

    return { startDiv, endDiv };
  };
  // Hàm highlight các đoạn văn bản nằm giữa từ đầu và từ cuối
  const concatenateAndHighlight = (
    textLayerDiv,
    startDiv,
    endDiv,
    sortedTextArray
  ) => {
    let highlightStarted = false;
    const matchedDivs = [];
    let accumulatedText = ""; // Dùng để nối các đoạn văn bản kiểm tra endWords
    console.log(accumulatedText);
    
    sortedTextArray.forEach((item) => {
      if (!highlightStarted && item.str.includes(startDiv.str)) {
        highlightStarted = true;
      }

      if (highlightStarted) {
        matchedDivs.push(item);
        accumulatedText += item.str + " "; // Tích lũy văn bản từ các div
      }

      // Kiểm tra nếu accumulatedText chứa toàn bộ endDiv.str
      if (item === endDiv) {
        highlightStarted = false;
      }
    });

    // Highlight các div đã nối
    matchedDivs.forEach((item) => {
      const divs = textLayerDiv.querySelectorAll("div");

      divs.forEach((div) => {
        const divText = div.textContent;

        if (divText === item.str) {
          const highlightDiv = document.createElement("span");
          highlightDiv.style.backgroundColor = "yellow"; // Màu highlight
          highlightDiv.textContent = divText;

          div.innerHTML = ""; // Xóa nội dung cũ
          div.appendChild(highlightDiv); // Thêm highlight
        }
      });
    });
  };
  // const analyzePDFStructure = (textContent, viewport) => {
  //   const contentDistribution = { left: 0, middle: 0, right: 0 };

  //   // Xác định giới hạn của trang PDF
  //   let minX = viewport.width;
  //   let maxX = 0;

  //   // Lọc các phần tử văn bản để xác định khoảng giới hạn
  //   textContent.items.forEach((item) => {
  //     const x = item.transform[4];
  //     const itemWidth = item.width || 0; // Chiều rộng của đoạn văn bản
  //     minX = Math.min(minX, x);
  //     maxX = Math.max(maxX, x + itemWidth);
  //   });

  //   const columnWidth = (maxX - minX) / 3; // Chia trang thành 3 phần đều nhau

  //   textContent.items.forEach((item) => {
  //     const x = item.transform[4];
  //     const itemWidth = item.width || 0;
  //     const centerX = x + itemWidth / 2; // Tâm đoạn văn bản

  //     // Xác định cột
  //     if (centerX < minX + columnWidth) {
  //       contentDistribution.left++;
  //     } else if (centerX < minX + columnWidth * 2) {
  //       contentDistribution.middle++;
  //     } else {
  //       contentDistribution.right++;
  //     }
  //   });

  //   // Trả về kết quả dựa trên phân bố nội dung
  //   if (contentDistribution.right > 0) {
  //     return "widthWhiteSpace";
  //   } else {
  //     return "standard";
  //   }
  // };

  // const processPDF = (textContent, viewport) => {
  //   const fileType = analyzePDFStructure(textContent, viewport);
  //   const englishText = [];
  //   const vietnameseText = [];
  //   const whiteSpace = [];
    
  //   const columnbBoundary1 = viewport.width * 0.52;
  //   const columnbBoundary2 = viewport.width * 0.42;

  //   textContent.items.forEach((item) => {
  //     const x = item.transform[4];
  //     if (fileType === "standard") {
  //       if (x < columnbBoundary1) {
  //         englishText.push(item);
  //       } else {
  //         vietnameseText.push(item);
  //       }
  //     } else {
  //       if (x < columnbBoundary1) {
  //         englishText.push(item);
  //       } else if (x < columnbBoundary2) {
  //         whiteSpace.push(item);
  //       } else {
  //         vietnameseText.push(item);
  //       }
  //     }
  //   });

  //   return { englishText, vietnameseText, whiteSpace };
  // };
  const processPDF = (textContent, viewport) => {
    const allText = [];
  
    textContent.items.forEach((item) => {
      allText.push(item);
    });
  
    return { allText };
  };
  // const analyzePDFStructure2 = (textContent, viewport) => {
  //   const contentDistribution = { left: 0, middle: 0, right: 0 };

  //   // Xác định giới hạn của trang PDF
  //   let minX = viewport.width;
  //   let maxX = 0;

  //   // Lọc các phần tử văn bản để xác định khoảng giới hạn
  //   textContent.items.forEach((item) => {
  //     const x = item.transform[4];
  //     const itemWidth = item.width || 0; // Chiều rộng của đoạn văn bản
  //     minX = Math.min(minX, x);
  //     maxX = Math.max(maxX, x + itemWidth);
  //   });

  //   const columnWidth = (maxX - minX) / 3; // Chia trang thành 3 phần đều nhau

  //   textContent.items.forEach((item) => {
  //     const x = item.transform[4];
  //     const itemWidth = item.width || 0;
  //     const centerX = x + itemWidth / 2; // Tâm đoạn văn bản

  //     // Xác định cột
  //     if (centerX < minX + columnWidth) {
  //       contentDistribution.left++;
  //     } else if (centerX < minX + columnWidth * 2) {
  //       contentDistribution.middle++;
  //     } else {
  //       contentDistribution.right++;
  //     }
  //   });

  //   // Trả về kết quả dựa trên phân bố nội dung
  //   if (contentDistribution.right > 0) {
  //     return "widthWhiteSpace";
  //   } else {
  //     return "standard";
  //   }
  // };

  // const processPDF2 = (textContent, viewport) => {
  //   const fileType = analyzePDFStructure2(textContent, viewport);
  //   const englishText = [];
  //   const vietnameseText = [];
  //   const whiteSpace = [];

  //   const columnbBoundary1 = viewport.width * 0.52;
  //   const columnbBoundary2 = viewport.width * 0.42;

  //   textContent.items.forEach((item) => {
  //     const x = item.transform[4];
  //     if (fileType === "standard") {
  //       if (x < columnbBoundary1) {
  //         englishText.push(item);
  //       } else {
  //         vietnameseText.push(item);
  //       }
  //     } else {
  //       if (x < columnbBoundary1) {
  //         englishText.push(item);
  //       } else if (x < columnbBoundary2) {
  //         whiteSpace.push(item);
  //       } else {
  //         vietnameseText.push(item);
  //       }
  //     }
  //   });
  //   return { englishText, vietnameseText, whiteSpace };
  // };
  const processPDF2 = (textContent, viewport) => {
    const allText = [];
  
    textContent.items.forEach((item) => {
      allText.push(item);
    });
  
    return { allText };
  };
  const mergeText = (textArray) => {
    let mergedText = [];
    let currentText = "";
    let currentTransform = textArray[0]?.transform || [];
    const yThreshold = 10; // Ngưỡng tối thiểu cho sự khác biệt về y, có thể điều chỉnh

    textArray.forEach((item, index) => {
      const currentY = currentTransform[5];
      const itemY = item.transform[5];

      // Nếu trục X giống nhau và trục Y gần nhau, gộp các đoạn văn bản
      if (
        item.transform[0] === currentTransform[0] &&
        Math.abs(itemY - currentY) <= yThreshold
      ) {
        currentText += item.str; // Gộp văn bản
      } else {
        // Nếu không giống nhau, lưu chuỗi hiện tại và bắt đầu chuỗi mới
        if (currentText.trim() !== "") {
          mergedText.push({ str: currentText, transform: currentTransform });
        }
        currentText = item.str;
        currentTransform = item.transform;
      }
    });

    // Đảm bảo lưu chuỗi cuối cùng
    if (currentText.trim() !== "") {
      mergedText.push({ str: currentText, transform: currentTransform });
    }

    return mergedText;
  };

  const renderPage =useCallback( async (pageNum, pdfDoc, searchText) => {
    if (!pdfDoc) {
      console.error("pdfDoc is null or undefined.");
      return;
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = containerRef.current.querySelector("canvas");
      const textLayerDiv = containerRef.current.querySelector("#text-layer");

      if (!canvas || !textLayerDiv) {
        console.error("Canvas or text layer not found.");
        return;
      }

      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Hủy tác vụ render trước đó nếu đang chạy
      if (renderTask) {
        renderTask.cancel();
      }

      // Bắt đầu render trang PDF
      // eslint-disable-next-line 
      renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      });

      await renderTask.promise; // Đợi render hoàn tất
      renderTask = null; // Đặt lại renderTask sau khi hoàn thành

      // Xử lý text content
      const textContent = await page.getTextContent();
      // const { englishText, vietnameseText } = processPDF(textContent, viewport);
      const {allText} = processPDF(textContent,viewport)

      // const combinedTextArray = [...englishText];
      // const combinedTextArrayVietName = [...vietnameseText];
      const combinedTextArray = [...allText]
      combinedTextArray.sort((a, b) => a.transform[5] - b.transform[5]);

      showContentPDF(combinedTextArray, textLayerDiv, viewport, searchText);
      // showContentPDF(
      //   combinedTextArrayVietName,
      //   textLayerDiv,
      //   viewport,
      //   searchText
      // );
    } catch (error) {
      console.error("Error during rendering:", error);
    }
  },[]);
  const showContentPDF2 = (textArray, textLayerDiv, viewport, searchText) => {
    const mergedTextArray = mergeText(textArray);

    // Sắp xếp các đoạn văn bản theo tọa độ Y (top position)
    const sortedTextArray = mergedTextArray.sort(
      (a, b) => b.transform[5] - a.transform[5]
    );

    // Vẽ văn bản lên layer
    sortedTextArray.forEach((item) => {
      const fullText = item.str;

      let existingDiv = Array.from(textLayerDiv.children).find(
        (div) => div.textContent === fullText
      );

      if (!existingDiv) {
        const div = document.createElement("div");

        const scale = viewport.transform[0];
        const adjustedTop = viewport.height - item.transform[5] * scale;
        let adjustedTopWithMargin = adjustedTop;

        div.style.position = "absolute";
        div.style.top = `${adjustedTopWithMargin}px`;
        div.style.left = `${item.transform[4] * scale}px`;
        div.style.fontSize = `${item.transform[3] * scale}px`;
        div.style.fontFamily = "Arial, sans-serif";
        div.style.whiteSpace = "pre-nowrap";
        div.style.direction = "ltr";
        div.style.unicodeBidi = "embed";
        div.textContent = fullText;

        // Thêm div vào text layer
        textLayerDiv.appendChild(div);
      }
    });

    if (Array.isArray(searchText) && searchText.length > 0) {
      searchText.forEach((text, index) => {
        const { startWords, endWords } = getSearchKeywords(text);
        
        const { startDiv, endDiv } = findDivsWithStartEnd(
          sortedTextArray,
          startWords,
          endWords
        );
        if (startDiv && endDiv) {
          concatenateAndHighlight(
            textLayerDiv,
            startDiv,
            endDiv,
            sortedTextArray
          );
        }
      });
    } else {
      console.log("searchText is empty or undefined");
    }
  };
  const renderPage2 =useCallback( async (pageNum, pdfDoc, searchText) => {
    if (!pdfDoc) {
      console.error("pdfDoc is null or undefined.");
      return;
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = containerRef2.current.querySelector("canvas");
      const textLayerDiv = containerRef2.current.querySelector("#text-layer2");

      if (!canvas || !textLayerDiv) {
        console.error("Canvas or text layer not found.");
        return;
      }

      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Hủy tác vụ render trước đó nếu đang chạy
      if (renderTask2) {
        renderTask2.cancel();
      }

      // Bắt đầu render trang PDF
      // eslint-disable-next-line 
      renderTask2 = page.render({
        canvasContext: context,
        viewport: viewport,
      });

      await renderTask2.promise; // Đợi render hoàn tất
      renderTask2 = null; // Đặt lại renderTask sau khi hoàn thành

      // Xử lý text content
      const textContent = await page.getTextContent();
      // const { englishText, vietnameseText } = processPDF2(
      //   textContent,
      //   viewport
      // );
      const {allText} = processPDF2(
          textContent,
          viewport
        );
      const combinedTextArray = [...allText];
      // const combinedTextArrayVietName = [...vietnameseText];
      combinedTextArray.sort((a, b) => a.transform[5] - b.transform[5]);

      showContentPDF2(combinedTextArray, textLayerDiv, viewport, searchText);
      // showContentPDF2(
      //   combinedTextArrayVietName,
      //   textLayerDiv,
      //   viewport,
      //   searchText
      // );
    } catch (error) {
      console.error("Error during rendering:", error);
    }
  },[]);

  const showContentPDF = (textArray, textLayerDiv, viewport, searchText) => {
    // Kết hợp các đoạn văn bản nhỏ thành một mảng duy nhất

    const mergedTextArray = mergeText(textArray);
    
    // Sắp xếp các đoạn văn bản theo tọa độ Y (top position)
    const sortedTextArray = mergedTextArray.sort(
      (a, b) => b.transform[5] - a.transform[5]
    );

    // Vẽ văn bản lên layer
    sortedTextArray.forEach((item) => {
      const fullText = item.str;

      let existingDiv = Array.from(textLayerDiv.children).find(
        (div) => div.textContent === fullText
      );
      if (!existingDiv) {
        const div = document.createElement("div");

        const scale = viewport.transform[0];
        const adjustedTop = viewport.height - item.transform[5] * scale;
        let adjustedTopWithMargin = adjustedTop;

        div.style.position = "absolute";
        div.style.top = `${adjustedTopWithMargin}px`;
        div.style.left = `${item.transform[4] * scale}px`;
        div.style.fontSize = `${item.transform[3] * scale}px`;
        div.style.fontFamily = "Arial, sans-serif";
        div.style.whiteSpace = "pre-nowrap";
        div.style.direction = "ltr";
        div.style.unicodeBidi = "embed";
        div.textContent = fullText;

        // Thêm div vào text layer
        textLayerDiv.appendChild(div);
      }
    });

    if (Array.isArray(searchText) && searchText.length > 0) {
      searchText.forEach((text) => {
        const { startWords, endWords } = getSearchKeywords(text);

        const { startDiv, endDiv } = findDivsWithStartEnd(
          sortedTextArray,
          startWords,
          endWords
        );
        if (startDiv && endDiv) {
          concatenateAndHighlight(
            textLayerDiv,
            startDiv,
            endDiv,
            sortedTextArray
          );
        }
      });
    } else {
      console.log("searchText is empty or undefined");
    }
  };

  const handleFileStandardUpload = async (e) => {
    const textLayerDiv = containerRef.current.querySelector("#text-layer");
    textLayerDiv.innerHTML = "";
    const file = e.target.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const arrayBuffer = event.target.result;
        pdfjsLib.getDocument(arrayBuffer).promise.then((pdfDoc) => {
          setPDFStandard(pdfDoc);
          renderPage(1, pdfDoc, []); // Render trang đầu tiên
        });
      };
      fileReader.readAsArrayBuffer(file);
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${url}/upload-file`, {
      method: "POST",
      headers: {"user_id": userID},
      body: formData,
    });
    const result = await response.json();
    setUrlFile(result.url);
  };

  const getBotResponse = useCallback( async (file_1, file_2, diff_f1, diff_f2) => {
    setAnswer("");
    const body = {
        user_id:userID,
        file_1: file_1,
        file_2: file_2,
        missing_sentences: diff_f1,
        additional_sentences: diff_f2,
     
    };

    const response = await fetch(`${url}/get-bot-response`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    console.log(result);
    
    if (!response.body) {
      console.error("No response body");
      return;
    }

    setAnswer(result.response);
  },[userID,url]);

  const handleFileStandardUpload2 = async (e) => {
    const textLayerDiv2 = containerRef2.current.querySelector("#text-layer2");
    textLayerDiv2.innerHTML = "";
    const file = e.target.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const arrayBuffer = event.target.result;
        pdfjsLib.getDocument(arrayBuffer).promise.then((pdfDoc) => {
          setPDFStandard2(pdfDoc);
          renderPage2(1, pdfDoc, []); // Render trang đầu tiên
        });
      };
      fileReader.readAsArrayBuffer(file);
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${url}/upload-file`, {
      method: "POST",
      headers: {"user_id": userID},
      body: formData,
    });
    const result = await response.json();

    setUrlFile2(result.url);
  };

  const handleCompare = async () => {
    try {
      setTimeout(() => setIsLoading(true), 0);  // Đặt loading trước
   

    setResultCompare([]);  // Xóa kết quả cũ
      const data = {
        url_1: urlFile,
        url_2: urlFile2,
      };

      const response = await fetch(`${url}/compare-file`, {
        method: "POST",
        "Content-Type": "application/json",
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log(result);
      
      setResultCompare(result);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
      const userId = uuidv4();
      setUserID(userId);
    }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        let diff_page = [];
        let file1Data = [];
        let file2Data = [];
        if (resultCompare && resultCompare.length > 0) {
          for (const item of resultCompare) {
            diff_page.push(item.page);
            if (item.page === page) {
              setIsLoading(true);
              setAnswer("");
              if (item.missing_sentences_English || item.missing_sentences_Vietnamese) {
                file1Data = [
                  ...file1Data,
                  ...(item.missing_sentences_English || []),
                  ...(item.missing_sentences_Vietnamese || []),
                ];
              }

              if (item.additional_sentences_English || item.missing_sentences_Vietnamese) {
                file2Data = [
                  ...file2Data,
                  ...(item.additional_sentences_English || []),
                  ...(item.additional_sentences_Vietnamese || []),
                ];
              }

              let file_1 =  item.content_file1_Vietnamese?.join(" ") ?? item.content_file1_English?.join(" ") ?? "";
              
              let file_2 = item.content_file2_Vietnamese?.join(" ") ?? item.content_file2_English?.join(" ")  ?? "";
              
              let diff_f1 = item.missing_sentences_Vietnamese ?? item.missing_sentences_English  ?? [];
              
              let diff_f2 = item.additional_sentences_Vietnamese ?? item.additional_sentences_English ?? [];

              await getBotResponse(file_1, file_2, diff_f1, diff_f2);
            }
          }
          setHighlightData({ file1: file1Data, file2: file2Data });
          setDiffPage(diff_page);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [resultCompare, page,getBotResponse]);
  const handleChangePage = async (direction) => {
    const textLayerDiv = containerRef.current.querySelector("#text-layer");
    textLayerDiv.innerHTML = "";

    const textLayerDiv2 = containerRef2.current.querySelector("#text-layer2");
    textLayerDiv2.innerHTML = "";

    const newPage = direction === "next" ? currentPage + 1 : currentPage - 1;

    if (
      pdfStandard &&
      pdfStandard2 &&
      newPage > 0 &&
      newPage <= pdfStandard.numPages
    ) {
      setCurrentPage(newPage);
      await renderPage(newPage, pdfStandard, highlightData.file1 || []);
      await renderPage2(newPage, pdfStandard2, highlightData.file2 || []);
      setPage(newPage);
    }
  };
  const handlePageChange = async (e) => {
    const selectedPage = parseInt(e.target.value, 10);
    const textLayerDiv = containerRef.current.querySelector("#text-layer");
    textLayerDiv.innerHTML = "";

    const textLayerDiv2 = containerRef2.current.querySelector("#text-layer2");
    textLayerDiv2.innerHTML = "";
    setCurrentPage(selectedPage);
    await renderPage(selectedPage, pdfStandard, highlightData.file1 || []);
    await renderPage2(selectedPage, pdfStandard2, highlightData.file2 || []);
    setPage(selectedPage);
  };
  // Thay thế 2 hàm cũ:
  const handleNextPage = () => handleChangePage("next");
  const handlePrevPage = () => handleChangePage("prev");
  useEffect(() => {
    let isCancelled = false;

    const renderPDFs = async () => {
      if (isCancelled) return;
      if (highlightData.file1.length > 0 && highlightData.file2.length > 0) {
        await Promise.all([
          renderPage(page, pdfStandard, highlightData.file1),
          renderPage2(page, pdfStandard2, highlightData.file2),
        ]);
      }
    };

    renderPDFs();

    return () => {
      isCancelled = true;
      if (renderTask) renderTask.cancel();
      if (renderTask2) renderTask2.cancel();
    };
  }, [page, highlightData,pdfStandard,pdfStandard2,renderPage,renderPage2,renderTask,renderTask2]);
  useEffect(() => {
    // Kiểm tra mỗi khi urlFile hoặc urlFile2 thay đổi
    if (urlFile && urlFile2) {
      setIsButtonEnabled(true);
    } else {
      setIsButtonEnabled(false);
    }
  }, [urlFile, urlFile2]);
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("userId"));
    if (storedData && storedData.expiry > Date.now()) {
      // Nếu có userId trong localStorage và chưa hết hạn
      setUserID(storedData.userId);
    } else {
      // Nếu không có hoặc đã hết hạn
      const newUserId = uuidv4();
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // Thời gian hết hạn 1 ngày
      localStorage.setItem(
        "userId",
        JSON.stringify({ userId: newUserId, expiry: expiryTime })
      );
      setUserID(newUserId);
    }
  }, []);
  const handleOpenChatBlock = () => {
    const isOpenBlock = !isOpen;
    setIsOpen(isOpenBlock);
  };
  return (
    <div className="h-[150vh]">
      <div className="h-[8%] w-full">
        <button
          className="p-3 border bg-blue-300 rounded-lg mt-1 font-medium ml-2 hover:bg-blue-500 hover:text-white"
          onClick={handleBack}
        >
          Back to Chatbot
        </button>
      </div>
      <div className="flex h-[92%]">
        <div className="w-[45%] h-full border-black border bg-blue-100">
          <input type="file" onChange={handleFileStandardUpload} />
          <div
            id="pdf-standard-container"
            ref={containerRef}
            className="relative"
          >
            <canvas hidden></canvas>
            <div
              id="text-layer"
              className="relative top-[40px] left-0 w-full h-full"
            ></div>
          </div>
          {pdfStandard && pdfStandard2 && (
            <div className="flex justify-between mt-2">
              <button
                onClick={handlePrevPage}
                className="px-4 py-2 bg-blue-300 rounded hover:bg-blue-500"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                className="px-4 py-2 bg-blue-300 rounded hover:bg-blue-500"
              >
                Next
              </button>
            </div>
          )}
        </div>
        <div className="w-[10%] border flex flex-col border-black h-full justify-center items-center">
          <div className="mb-4 justify-center items-center flex flex-col">
            <label htmlFor="pageSelect" className="mr-2 font-medium">
              Chọn trang:
            </label>
            <select
              id="pageSelect"
              onChange={handlePageChange}
              value={currentPage || ""}
              className="p-2 border rounded"
            >
              {diffPage.map((page, index) => (
                <option key={index} value={page}>
                  Trang {page}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`px-6 py-3 text-xl font-bold justify-center items-center border border-black rounded-md ${
              isButtonEnabled
                ? "hover:bg-blue-500 hover:text-white bg-[#6f91ff] cursor-pointer"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            onClick={handleCompare}
            disabled={!isButtonEnabled}
          >
            Compare
          </button>
        </div>
        <div className="w-[45%] border border-black h-full bg-red-100">
          <input type="file" onChange={handleFileStandardUpload2} />
          <div
            id="pdf-standard-container2"
            ref={containerRef2}
            className="relative"
          >
            <canvas hidden></canvas>
            <div
              id="text-layer2"
              className="relative top-[40px] left-0 w-full h-full"
            ></div>
          </div>
        </div>
      </div>

      <div className="hover:cursor-pointer">
        <BsChatRightFill
          className="fixed z-50 bottom-5 text-red-500 right-3 text-3xl"
          onClick={handleOpenChatBlock}
        />
      </div>
      {isOpen ? (
        <div className="fixed min-w-[450px] max-h-[500px] overflow-y-auto min-h-[500px] bg-white z-40 border border-black rounded-md bottom-7 right-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              table: ({ node, ...props }) => (
                <table className="markdown-table" {...props} />
              ),
            }}
          >
            {answer}
          </ReactMarkdown>
        </div>
      ) : (
        <div></div>
      )}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <p className="mb-4 text-lg font-semibold">
              Đang xử lý file, vui lòng đợi...
            </p>
            <div className="loader"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareContract;
