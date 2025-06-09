import React, { useState, useEffect, useRef, useMemo } from "react";

const RenderDocumentOverlay = ({ dataFile, pageWidth, pageHeight }) => {
  // eslint-disable-next-line
  const pages = useMemo(
    () => [...new Set(dataFile.map((item) => item.page))],
    [dataFile]
  );
  const containerWidth = pageWidth * 96 * 1.2;
  const containerHeight = pageHeight * 96 * 1.4;
  const [content, setContent] = useState({});
  const [heights, setHeights] = useState({});
  const [originalTops, setOriginalTops] = useState({});
  const [adjustedTops, setAdjustedTops] = useState({});

  const textareaRefs = useRef({});

  useEffect(() => {
    let tops = {};
    let initHeights = {};
    let initContents = {};
    pages.forEach((pageNum) => {
      const itemsInPage = dataFile.filter((item) => item.page === pageNum);
      itemsInPage.forEach((item, idx) => {
        const polygon = item.polygon;
        if (!polygon || polygon.length < 8) return;

        const yValues = [];
        for (let i = 1; i < polygon.length; i += 2) {
          yValues.push(polygon[i]);
        }
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const topPx = (minY / pageHeight) * containerHeight;
        const heightPx = ((maxY - minY) / pageHeight) * containerHeight;

        const key = `${pageNum}-${idx}`;
        tops[key] = topPx;
        initHeights[key] = heightPx;
        initContents[key] = item.content || "";
      });
    });

    setOriginalTops(tops);
    setAdjustedTops(tops);
    setHeights(initHeights);
    setContent(initContents);
    // eslint-disable-next-line
  }, [dataFile, pageHeight, containerHeight]);
  // Khi heights thay đổi thì tính lại vị trí adjustedTops
  useEffect(() => {
    const newAdjustedTops = {};
    pages.forEach((pageNum) => {
      const itemsInPage = dataFile.filter((item) => item.page === pageNum);
      for (let i = 0; i < itemsInPage.length; i++) {
        const key = `${pageNum}-${i}`;
        if (i === 0) {
          newAdjustedTops[key] = originalTops[key] ?? 0;
        } else {
          const prevKey = `${pageNum}-${i - 1}`;
          const prevTop = newAdjustedTops[prevKey] ?? 0;
          const prevHeight = heights[prevKey] ?? 20;
          newAdjustedTops[key] = prevTop + prevHeight;
        }
      }
    });
    setAdjustedTops(newAdjustedTops);
    // eslint-disable-next-line
  }, [heights, originalTops, dataFile]);

  // Hàm xử lý thay đổi chiều cao
  const handleInput = (e, pageNum, idx) => {
    const key = `${pageNum}-${idx}`;
    const textarea = textareaRefs.current[key];
    if (!textarea) return;

    const newValue = e.target.value;
    setContent((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    requestAnimationFrame(() => {
      const textarea = textareaRefs.current[key];
      if (!textarea) return;

      textarea.style.height = "auto"; // Reset để tính đúng
      const newHeight = textarea.scrollHeight;

      textarea.style.height = `${newHeight}px`; // Gán lại để đảm bảo hiển thị đúng
      setHeights((prev) => ({
        ...prev,
        [key]: newHeight,
      }));
    });
  };

  useEffect(() => {
    const observers = {};

    Object.entries(textareaRefs.current).forEach(([key, textarea]) => {
      if (!textarea) return;

      const observer = new ResizeObserver(() => {
        const newHeight = textarea.scrollHeight;
        setHeights((prev) => ({
          ...prev,
          [key]: newHeight,
        }));
      });

      observer.observe(textarea);
      observers[key] = observer;
    });

    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect());
    };
  }, [content]);

  return (
    <div>
      {pages.map((pageNum) => {
        const itemsInPage = dataFile.filter((item) => item.page === pageNum);

        return (
          <div
            key={pageNum}
            style={{
              position: "relative",
              width: containerWidth,
              height: containerHeight,
              marginBottom: "20px",
              border: "1px solid #ccc",
            }}
          >
            {itemsInPage.map((item, idx) => {
              const polygon = item.polygon;
              if (!polygon || polygon.length < 8) return null;

              const xValues = [];
              const yValues = [];
              for (let i = 0; i < polygon.length; i += 2) {
                xValues.push(polygon[i]);
                yValues.push(polygon[i + 1]);
              }

              const leftPx =
                (Math.min(...xValues) / pageWidth) * containerWidth * 0.9;
              const widthPx =
                ((Math.max(...xValues) - Math.min(...xValues)) / pageWidth) *
                1.1 *
                containerWidth;
              const heightPx =
                ((Math.max(...yValues) - Math.min(...yValues)) / pageHeight) *
                containerHeight;

              const key = `${pageNum}-${idx}`;
              const top = adjustedTops[key] ?? 0;

              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: leftPx,
                    top,
                    width: widthPx,
                    height: heightPx,
                    minWidth: "202px",
                    transition: "top 0.2s ease",
                  }}
                >
                  <textarea
                    ref={(el) => (textareaRefs.current[key] = el)}
                    value={content[key] || ""}
                    className="w-full overflow-hidden resize-none leading-snug"
                    style={{
                      boxSizing: "border-box",
                      fontSize: "15px",
                      lineHeight: "1.4",
                      height: heights[key]
                        ? `${heights[key]}px`
                        : `${heightPx}`,
                      // whiteSpace: "pre-wrap",
                      // wordBreak: "break-word",
                      // overflowWrap: "break-word",
                    }}
                    onInput={(e) => handleInput(e, pageNum, idx)}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default RenderDocumentOverlay;
