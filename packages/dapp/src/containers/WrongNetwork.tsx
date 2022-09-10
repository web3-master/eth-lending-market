import { Button, Result } from "antd";

const WrongNetwork = () => {
  const onHowto = () => {
    window.open("https://www.openattestation.com/docs/appendix/ropsten-setup/");
  };

  return (
    <Result
      status="warning"
      title="You are not connected to network."
      subTitle="Please connect in MetaMask first!"
      extra={
        <Button type="primary" key="howto" onClick={onHowto}>
          How to do?
        </Button>
      }
    />
  );
};

export default WrongNetwork;
