import { Button, Result } from "antd";

const WrongNetwork = () => {
  const onHowto = () => {
    window.open("https://blog.cryptostars.is/goerli-g%C3%B6rli-testnet-network-to-metamask-and-receiving-test-ethereum-in-less-than-2-min-de13e6fe5677");
  };

  return (
    <Result
      status="warning"
      title="You are not connected to network."
      subTitle="Please connect to Goerli in MetaMask first!"
      extra={
        <Button type="primary" key="howto" onClick={onHowto}>
          How to do?
        </Button>
      }
    />
  );
};

export default WrongNetwork;
