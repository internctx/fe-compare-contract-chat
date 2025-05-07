import { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
function Login() {
  const backgroundImageStyle = {
    backgroundImage: "url(/background/background.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100%",
    width: "100%",
  };

  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLoginWithMS = () => {
    // window.location.href = 'https://3rd-jira-plugin-d3dwb7ckb2b2fmhp.southindia-01.azurewebsites.net/api/v1/login';
    window.location.href = 'http://localhost:5003/api/v1/login';
};


  const togglePasswordVisible = () => {
    setPasswordVisible(!passwordVisible);
  };
  return (
    <div>
      <div
        style={backgroundImageStyle}
        className="w-full h-full min-h-[100vh] relative"
      >
        <div className="flex items-center justify-center w-full h-full absolute">
          <div className="w-[33%] h-[45%] bg-slate-200">
            <h1 className="text-4xl text-center p-3 font-semibold uppercase">
              Login
            </h1>
            <form className="">
              <div className="px-6">
                <h2 className="pb-2 font-normal text-xl">Username: </h2>
                <input
                  type="email"
                  required
                  className="w-full h-8 bg-slate-200 border-b-blue-600 border-b-2 border focus:outline-none "
                />
              </div>
              <div className="px-6 pt-2">
                <h2 className="pb-2 font-normal text-xl">Password: </h2>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    required
                    className="w-full h-8 bg-slate-200 border-b-blue-600 border-b-2 border focus:outline-none "
                  />
                  <span
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    onClick={togglePasswordVisible}
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
              <button className="ml-[42%] mt-2 text-white rounded-md hover:bg-blue-600 px-6 py-3 text-lg bg-blue-400">
                Login
              </button>
            </form>
            <div>
              <div className="mx-4 p-2 rounded-md hover:bg-slate-500 cursor-pointer justify-center hover:text-white w-[30%] flex gap-2 bg-slate-300"
                    onClick={handleLoginWithMS}
                  >
                <img
                  src="/background/mincrosoftpng.png"
                  alt="Microsoft"
                  className="w-7"
                />
                <p className="text-lg">Microsoft</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
