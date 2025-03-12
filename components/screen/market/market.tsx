import React from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SearchIcon, XIcon, CircleIcon, FlameIcon } from "lucide-react";
import { KioskCreator } from "./kiosk-creator";

const CardItem = ({ element, amount, id, price }) => {
  return (
    <Card className="w-44 bg-transparent border border-[#1f1f1f]">
      <CardContent className="p-4">
        <div className="text-white text-sm font-normal font-['Sora']">
          {`{\n"p": "sui-20",\n"element": "${element}", \n"amt": "${amount}"\n}`}
        </div>
      </CardContent>

      <div className="flex flex-col items-center gap-2 px-4 pb-4">
        {/* Logo placeholder - would replace with actual logo component */}
        <div className="w-24 h-24 opacity-5 bg-gray-800 flex items-center justify-center">
          {/* Logo would go here */}
        </div>

        <div className="text-[#68ffd1] text-sm font-normal font-['Sora'] underline">
          {id}
        </div>

        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-1">
            <div className="text-white text-xs font-normal font-['Sora']">
              {price}
            </div>
          </div>
          <Button className="px-4 h-8 rounded-3xl bg-[#a668ff] hover:bg-[#9655e8] text-black text-xs uppercase">
            Buy
          </Button>
        </div>
      </div>
    </Card>
  );
};

// SearchBar component
const SearchBar = () => {
  return (
    <div className="w-full flex items-center gap-2">
      <div className="relative flex-grow">
        <Input
          className="h-10 px-10 py-2 bg-[#141414] border-[#333333] rounded-3xl text-[#5c5c5c]"
          placeholder="Search items..."
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
      </div>
      <div className="flex gap-1">
        <Badge className="px-4 py-1 rounded-3xl bg-[#a668ff] hover:bg-[#9655e8] text-black text-xs uppercase">
          Owned
        </Badge>
        <Badge className="px-4 py-1 rounded-3xl bg-white hover:bg-gray-200 text-black text-xs uppercase">
          Sell
        </Badge>
      </div>
    </div>
  );
};

// UserProfile component
const UserProfile = () => {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="px-3 py-1 bg-white text-black rounded-3xl"
      >
        <span className="text-xs font-normal font-['Sora'] uppercase">
          0xfda4...3368
        </span>
        {/* Fire icon would go here */}
      </Badge>

      <div className="flex items-center">
        {/* Flame icon would go here */}
        <span className="text-white text-sm font-normal font-['Sora']">
          3,300 ~ $11,550
        </span>
      </div>
    </div>
  );
};

// CardGrid component
const CardGrid = () => {
  const cards = [
    {
      element: "plant",
      amount: "100",
      id: "#0x3333...1144",
      price: "3~ $10.8",
    },
    {
      element: "tree",
      amount: "1000",
      id: "#0x3694...4369",
      price: "30~ $100.8",
    },
    {
      element: "plant",
      amount: "100",
      id: "#0x3333...1144",
      price: "3~ $10.8",
    },
    {
      element: "tree",
      amount: "1000",
      id: "#0x3694...4369",
      price: "30~ $100.8",
    },
    {
      element: "plant",
      amount: "100",
      id: "#0x3333...1144",
      price: "3~ $10.8",
    },
    {
      element: "tree",
      amount: "1000",
      id: "#0x3694...4369",
      price: "30~ $100.8",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card, index) => (
        <CardItem
          key={index}
          element={card.element}
          amount={card.amount}
          id={card.id}
          price={card.price}
        />
      ))}
    </div>
  );
};

export const NFTMarket = () => {
  return (
    <div className="w-full h-full gap-2 flex flex-col pt-20">
      <div className="flex flex-col gap-2 fixed top-0 left-0 right-0 p-4 bg-black">
        <UserProfile />
        <SearchBar />
      </div>
      <KioskCreator />
    </div>
  );
};
