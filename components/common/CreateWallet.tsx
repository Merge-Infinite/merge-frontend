import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const CreateWallet = () => {
  const router = useRouter();
  return (
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a1a3a] p-4 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between">
      <div className="mb-4 sm:mb-0">
        <h3 className="text-white text-lg font-['Sora'] mb-2">Create Wallet</h3>
        <p className="text-gray-400 text-sm">
          Create a wallet to start buying and selling NFTs
        </p>
      </div>
      <Button
        onClick={() => {
          router.push("/wallet");
        }}
        className="bg-[#a668ff] hover:bg-[#9655e8] text-black flex gap-2 text-white"
      >
        <Wallet className="mr-2 h-4 w-4" /> Create Wallet
      </Button>
    </div>
  );
};

export default CreateWallet;
