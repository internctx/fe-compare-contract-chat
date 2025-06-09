import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import "../pages/style.css"
const ResponseClause = ({content}) => {
  return (
    <div className="fixed min-w-[450px] max-h-[90vh] overflow-y-auto min-h-[500px] bg-white z-40 border border-black rounded-md bottom-7 right-3">
      {content.map((clause, idx) => (
        <ReactMarkdown
        key={idx}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ node, ...props }) => (
            <table className="markdown-table" {...props} />
          ),
        }}
      >
        {clause}
      </ReactMarkdown>
      ))}
    </div>
  );
};

export default ResponseClause;
