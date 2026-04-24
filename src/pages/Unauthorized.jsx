import PNF from "../assets/images/pnf.png"

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* <h1 className="text-2xl font-normal text-danger">
        Unauthorized Access
      </h1> */}
      <div className="rounded-full">
        <img className='pagenotfound rounded-4xl' src={PNF} alt="404 PaGe NoT FOunD" />
      </div>
    </div>
  );
};

export default Unauthorized;