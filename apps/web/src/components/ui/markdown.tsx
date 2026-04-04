import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Markdown({ children }: { children: string }) {
  return (
    <div
      className="
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#00d4aa] 
          [&_h1]:border-b [&_h1]:border-[#1e2a38] [&_h1]:pb-3 [&_h1]:mb-6 [&_h1]:mt-0
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4
          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-200 [&_h3]:mt-6 [&_h3]:mb-3
          [&_p]:text-gray-300 [&_p]:leading-relaxed [&_p]:my-3 [&_p]:text-sm
          [&_strong]:text-white [&_strong]:font-semibold
          [&_em]:text-gray-400 [&_em]:italic
          [&_code]:text-[#00d4aa] [&_code]:bg-[#080b10] [&_code]:px-1.5 
          [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-[#080b10] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-xs
          [&_thead]:bg-[#080b10]
          [&_th]:border [&_th]:border-[#1e2a38] [&_th]:p-3 
          [&_th]:text-left [&_th]:font-bold [&_th]:text-gray-400 [&_th]:uppercase [&_th]:tracking-wider
          [&_td]:border [&_td]:border-[#1e2a38] [&_td]:p-3 [&_td]:text-gray-300
          [&_tr:nth-child(even)]:bg-[#080b10]/50
          [&_hr]:border-[#1e2a38] [&_hr]:my-8
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
          [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
          [&_li]:text-gray-300 [&_li]:text-sm
          [&_blockquote]:border-l-2 [&_blockquote]:border-[#00d4aa] 
          [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_blockquote]:my-4 [&_blockquote]:italic
          [&_a]:text-[#00d4aa] [&_a]:no-underline hover:[&_a]:underline
        "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export default Markdown;
