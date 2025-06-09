import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { asBlob } from "html-docx-js/dist/html-docx.js";
import { saveAs } from "file-saver";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const RenderDocumentOverlay = ({ dataFile, pageWidth, pageHeight,dataHighlight }) => {
  const pages = useMemo(
    () => [...new Set(dataFile.map((item) => item.page))],
    [dataFile]
  );
  useEffect(() => {
    console.log("Highlight data changed", dataHighlight);
  }, [dataHighlight]);

  const containerWidth = pageWidth * 96 * 1.2;
  const containerHeight = pageHeight * 96 * 1.4;
  const TOOLBAR_HEIGHT = 42;

  const [htmlContent, setHtmlContent] = useState({});
  // heightsRef sẽ lưu trữ chiều cao thực tế của các editor mà không trigger re-render ngay lập tức
  const heightsRef = useRef({});
  const [adjustedTops, setAdjustedTops] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const editorWrapperRef = useRef(null);
  const quillRefs = useRef({});

  // Effect để khởi tạo nội dung và chiều cao/vị trí ban đầu
  // Sử dụng useLayoutEffect cho các tính toán layout ban đầu
  useLayoutEffect(() => {
    const initialOriginalTops = {};
    const initialHtmlContents = {};

    // --- Định nghĩa đoạn text bạn muốn highlight ---
    // Hàm trợ giúp để thoát các ký tự đặc biệt trong RegExp
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    pages.forEach((pageNum) => {
      const itemsInPage = dataFile.filter((item) => item.page === pageNum);
      itemsInPage.forEach((item, idx) => {
        const polygon = item.polygon;
        if (!polygon || polygon.length < 8) return;

        const yValues = polygon.filter((_, i) => i % 2 !== 0);
        const minY = Math.min(...yValues);

        const topPx = (minY / pageHeight) * containerHeight;

        const key = `${pageNum}-${idx}`;
        initialOriginalTops[key] = topPx;

        // --- Áp dụng highlight ở đây ---
        let content = item.content || "";
        // Chỉ highlight nếu nội dung item.content chứa đoạn textToHighlight
        dataHighlight.forEach((text) => {
          // Chỉ highlight nếu nội dung hiện tại chứa đoạn `text`
          if (content.includes(text)) {
            const highlightedHtml = `<span class="bg-yellow-300">${text}</span>`;
            const regex = new RegExp(escapeRegExp(text), "g"); // Tạo RegExp cho từng text
            content = content.replace(regex, highlightedHtml);
          }
        });
        initialHtmlContents[key] = content;
        // ---------------------------------
      });
    });

    // Khởi tạo heightsRef với chiều cao mặc định hoặc chiều cao từ polygon
    pages.forEach((pageNum) => {
      const itemsInPage = dataFile.filter((item) => item.page === pageNum);
      itemsInPage.forEach((item, idx) => {
        const key = `${pageNum}-${idx}`;
        const polygon = item.polygon;
        if (polygon && polygon.length >= 8) {
          const yValues = polygon.filter((_, i) => i % 2 !== 0);
          const minY = Math.min(...yValues);
          const maxY = Math.max(...yValues);
          // Lưu chiều cao ban đầu vào ref
          heightsRef.current[key] =
            ((maxY - minY) / pageHeight) * containerHeight;
        } else {
          heightsRef.current[key] = 20; // Default height if no polygon data
        }
      });
    });

    setHtmlContent(initialHtmlContents);
    // Sau khi khởi tạo xong, tính toán adjustedTops lần đầu
    recalculateAdjustedTops(initialOriginalTops);
    // eslint-disable-next-line
  }, [dataFile, pageHeight, containerHeight, pages,dataHighlight]); 

  // Hàm recalculateAdjustedTops được tạo ra để tái sử dụng
  const recalculateAdjustedTops = useCallback(
    (originalTopsMap) => {
      const newAdjustedTops = {};
      pages.forEach((pageNum) => {
        const itemsInPage = dataFile.filter((item) => item.page === pageNum);
        for (let i = 0; i < itemsInPage.length; i++) {
          const key = `${pageNum}-${i}`;
          if (i === 0) {
            // Item đầu tiên trong trang sử dụng vị trí top ban đầu
            newAdjustedTops[key] = originalTopsMap[key] ?? 0;
          } else {
            // Các item sau được định vị tương đối so với item trước đó
            const prevKey = `${pageNum}-${i - 1}`;
            const prevTop = newAdjustedTops[prevKey] ?? 0;
            // Lấy chiều cao từ heightsRef.current
            const prevHeight = heightsRef.current[prevKey] ?? 20;
            newAdjustedTops[key] = prevTop + prevHeight;
          }
        }
      });
      setAdjustedTops(newAdjustedTops);
    },
    [dataFile, pages]
  ); // dependencies cho useCallback

  const handleQuillBlur = useCallback(() => {
    // Đặt một timeout nhỏ để tránh trường hợp click vào toolbar
    // và editor bị đóng ngay lập tức
    setTimeout(() => {
      setEditingKey(null);
    }, 100); // Khoảng 100ms là đủ để React nhận diện click vào toolbar
  }, []);
  // Callback cho ResizeObserver
  const handleResize = useCallback(
    (key, newHeight) => {
      // Chỉ cập nhật heightsRef nếu có thay đổi đáng kể để tránh re-render không cần thiết
      // Math.abs(heightsRef.current[key] - newHeight) > 1 : Kiểm tra sự thay đổi nhỏ (ví dụ 1px)
      if (Math.abs(heightsRef.current[key] - newHeight) > 1) {
        heightsRef.current[key] = newHeight;

        // Kích hoạt tính toán lại adjustedTops.
        // Để đảm bảo tính toán đúng, cần truyền map originalTops vào hàm
        // Hoặc nếu originalTops không đổi sau khi mount, có thể lưu vào useRef
        const originalTopsMap = {};
        pages.forEach((pageNum) => {
          const itemsInPage = dataFile.filter((item) => item.page === pageNum);
          itemsInPage.forEach((item, idx) => {
            const polygon = item.polygon;
            if (!polygon || polygon.length < 8) return;
            const yValues = polygon.filter((_, i) => i % 2 !== 0);
            const minY = Math.min(...yValues);
            originalTopsMap[`${pageNum}-${idx}`] =
              (minY / pageHeight) * containerHeight;
          });
        });
        recalculateAdjustedTops(originalTopsMap);
      }
    },
    [recalculateAdjustedTops, dataFile, pageHeight, containerHeight, pages]
  );

  // Effect để giám sát và cập nhật chiều cao bằng ResizeObserver
  useEffect(() => {
    const observers = {};
    if (editingKey && quillRefs.current[editingKey]) {
      const quillEditor = quillRefs.current[editingKey];
      if (quillEditor && quillEditor.editor && quillEditor.editor.root) {
        const editorDiv = quillEditor.editor.root; // Đây là div chứa nội dung Quill

        // Lấy toolbar element. Nó thường là anh chị em liền kề của .ql-container (chứa .ql-editor)
        const quillContainer = editorDiv.closest(".ql-container");
        let toolbarElement = null;
        if (quillContainer) {
          // Toolbar thường là phần tử đứng trước container
          toolbarElement = quillContainer.previousElementSibling;
          // Hoặc tìm kiếm theo class trực tiếp nếu toolbar nằm ngoài .ql-container
          if (
            !toolbarElement ||
            !toolbarElement.classList.contains("ql-toolbar")
          ) {
            toolbarElement =
              editorWrapperRef.current?.querySelector(".ql-toolbar");
          }
        }

        const observer = new ResizeObserver(() => {
          const contentHeight = editorDiv.scrollHeight; // Chiều cao của nội dung Quill
          const toolbarActualHeight = toolbarElement
            ? toolbarElement.offsetHeight
            : TOOLBAR_HEIGHT; // Lấy chiều cao toolbar thực tế hoặc dùng hằng số

          // Tổng chiều cao mà khối ReactQuill chiếm dụng = chiều cao nội dung + chiều cao toolbar
          const totalOccupiedHeight = contentHeight + toolbarActualHeight + 2; // +2 cho border/padding nếu có

          handleResize(editingKey, totalOccupiedHeight); // Truyền tổng chiều cao vào handleResize
        });

        observer.observe(editorDiv);

        // Quan sát cả toolbar nếu bạn muốn chiều cao động hoàn toàn
        if (toolbarElement) {
          observer.observe(toolbarElement);
        }

        observers[editingKey] = observer;

        // Kích hoạt tính toán lại ban đầu khi editor mở để đảm bảo vị trí ban đầu đúng
        const initialContentHeight = editorDiv.scrollHeight;
        const initialToolbarHeight = toolbarElement
          ? toolbarElement.offsetHeight
          : TOOLBAR_HEIGHT;
        const initialTotalOccupiedHeight =
          initialContentHeight + initialToolbarHeight + 2;
        handleResize(editingKey, initialTotalOccupiedHeight);
      }
    }

    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect());
    };
  }, [editingKey, handleResize, TOOLBAR_HEIGHT, editorWrapperRef]);

  // Callback cho việc xử lý thay đổi nội dung của Quill editor
  const handleQuillChange = useCallback((value, pageNum, idx) => {
    const key = `${pageNum}-${idx}`;
    setHtmlContent((prev) => ({
      ...prev,
      [key]: value, // value là chuỗi HTML từ Quill
    }));
  }, []); // Không có dependencies vì chỉ sử dụng setter form của state
  const handleEditClick = useCallback((key) => {
    setEditingKey(key);
  }, []);
  // Hàm xử lý xuất DOCX
  const handleExportToDocx = useCallback(async () => {
    let fullHtmlString = "";

    pages.forEach((pageNum) => {
      const itemsInPage = dataFile.filter((item) => item.page === pageNum);
      itemsInPage.forEach((item, idx) => {
        const key = `${pageNum}-${idx}`;
        const content = htmlContent[key];
        if (content) {
          fullHtmlString += `<div>${content}</div>`;
        }
      });
      fullHtmlString += `<div style="margin-top: 50px;"></div>`;
    });

    console.log("Full HTML content for DOCX export:", fullHtmlString);

    try {
      const blob = await asBlob(fullHtmlString);
      saveAs(blob, "document_from_azure.docx");
      alert("File DOCX đã được xuất thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất DOCX:", error);
      alert("Đã xảy ra lỗi khi xuất file DOCX.");
    }
  }, [htmlContent, pages, dataFile]); // Dependencies
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If an editor is open AND the click is outside the editor wrapper
      if (
        editorWrapperRef.current &&
        !editorWrapperRef.current.contains(event.target)
      ) {
        setEditingKey(null); // Exit edit mode
      }
    };

    if (editingKey) {
      // Only add listener when an editor is active
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      // Clean up listener
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingKey]);
  return (
    <div>
      <button
        onClick={handleExportToDocx}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Xuất ra DOCX
      </button>

      {pages.map((pageNum) => {
        const itemsInPage = dataFile.filter((item) => item.page === pageNum);

        return (
          <div
            key={pageNum}
            style={{
              position: "relative",
              width: containerWidth,
              height: containerHeight, // Initial page height
              marginBottom: "20px",
              border: "1px solid #ccc",
              overflow: "hidden", // Ẩn nội dung tràn ra khỏi khung trang
            }}
          >
            {itemsInPage.map((item, idx) => {
              const polygon = item.polygon;
              if (!polygon || polygon.length < 8) return null;

              const xValues = polygon.filter((_, i) => i % 2 === 0);
              const yValues = polygon.filter((_, i) => i % 2 !== 0);

              const leftPx =
                (Math.min(...xValues) / pageWidth) * containerWidth * 0.5;
              const widthPx =
                ((Math.max(...xValues) - Math.min(...xValues)) / pageWidth) *
                1.1 *
                containerWidth;
              // Chiều cao ban đầu dựa trên polygon
              const initialHeightPx =
                ((Math.max(...yValues) - Math.min(...yValues)) / pageHeight) *
                containerHeight;
              // Chiều cao hiện tại để render, lấy từ heightsRef
              const currentRenderHeight =
                heightsRef.current[`${pageNum}-${idx}`] || initialHeightPx;

              const key = `${pageNum}-${idx}`;
              const top = adjustedTops[key] ?? 0; // Vị trí top đã điều chỉnh

              const isCurrentlyEditing = editingKey === key;

              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: leftPx,
                    top: isCurrentlyEditing ? top - TOOLBAR_HEIGHT : top,
                    width: widthPx,
                    // height: heightPx, // Không cần đặt height cố định ở đây nữa
                    minWidth: "202px",
                    transition: "top 0.2s ease", // Giữ lại transition nếu muốn mượt mà
                    zIndex: isCurrentlyEditing ? 12 : 10, // Đảm bảo Quill editor nằm trên các yếu tố khác
                    cursor: isCurrentlyEditing ? "auto" : "pointer",
                    marginTop: isCurrentlyEditing ? "42px" : "0px",
                  }}
                  onClick={
                    isCurrentlyEditing ? null : () => handleEditClick(key)
                  }
                  ref={isCurrentlyEditing ? editorWrapperRef : null}
                >
                  {isCurrentlyEditing ? (
                    <ReactQuill
                      key={key}
                      ref={(el) => (quillRefs.current[key] = el)}
                      theme="snow"
                      value={htmlContent[key] || ""}
                      onChange={(value) =>
                        handleQuillChange(value, pageNum, idx)
                      }
                      onBlur={handleQuillBlur}
                      modules={RenderDocumentOverlay.modules}
                      formats={RenderDocumentOverlay.formats}
                      style={{
                        fontSize: "15px",
                        // Đặt chiều cao cho Quill để nó giãn ra theo nội dung
                        height: `${currentRenderHeight}px - ${TOOLBAR_HEIGHT}`,
                      }}
                    />
                  ) : (
                    <div
                      // Quan trọng: Sử dụng một ref cục bộ để đo chiều cao của div hiển thị
                      ref={(el) => {
                        if (el) {
                          const newHeight = el.scrollHeight + 2; // +2 để tính padding/border
                          // Chỉ cập nhật heightsRef nếu không phải là editor đang chỉnh sửa
                          // và nếu chiều cao thay đổi đáng kể
                          if (
                            Math.abs(heightsRef.current[key] - newHeight) > 1
                          ) {
                            heightsRef.current[key] = newHeight;
                            // Recalculate adjustedTops ngay lập tức sau khi chiều cao của div không edit thay đổi
                            const originalTopsMap = {};
                            pages.forEach((pageNum) => {
                              const itemsInPage = dataFile.filter(
                                (item) => item.page === pageNum
                              );
                              itemsInPage.forEach((item, idx) => {
                                const polygon = item.polygon;
                                if (!polygon || polygon.length < 8) return;
                                const yValues = polygon.filter(
                                  (_, i) => i % 2 !== 0
                                );
                                const minY = Math.min(...yValues);

                                originalTopsMap[
                                  // eslint-disable-next-line
                                  `<span class="math-inline">\{pageNum\}\-</span>{idx}`
                                ] = (minY / pageHeight) * containerHeight;
                              });
                            });
                            recalculateAdjustedTops(originalTopsMap);
                          }
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: htmlContent[key] || "",
                      }}
                      style={{
                        minHeight: `${initialHeightPx}px`, // Đảm bảo chiều cao tối thiểu ban đầu
                        // Thêm padding hoặc styling nếu cần để phù hợp với Quill
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Định nghĩa modules và formats cho Quill (giữ nguyên)
RenderDocumentOverlay.modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "image"],
    ["clean"],
  ],
};

RenderDocumentOverlay.formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
];

export default RenderDocumentOverlay;
