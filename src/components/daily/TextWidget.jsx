const TextWidget = ({ value, onChange, placeholder, minHeight }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full bg-transparent resize-none outline-none text-sm leading-relaxed text-zinc-300 placeholder-zinc-700 custom-scrollbar ${minHeight || 'h-32'}`}
  />
);

export default TextWidget;
