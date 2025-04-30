import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ value, onChange, visible, setVisible, placeholder }) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 pr-10 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-3 cursor-pointer text-gray-300 hover:text-gray-100"
      >
        {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </span>
    </div>
  );
}
