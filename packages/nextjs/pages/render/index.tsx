import Script from "next/script";
import type { NextPage } from "next";

const Render: NextPage = () => {
  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js" />
      <Script src="http://127.0.0.1:3000/api/render" />
    </>
  );
};

export default Render;
