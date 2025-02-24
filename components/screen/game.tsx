"use client";

import { useUser } from "@/hooks/useUser";
import UserInfo from "../common/user-info";

export function GameScreen() {
  return (
    <div className="w-full h-full  flex-col justify-start items-start gap-2 inline-flex">
      <UserInfo />
      <div className="self-stretch h-96 flex-col justify-start items-start gap-4 flex">
        <div className="self-stretch h-10 rounded-3xl flex-col justify-start items-start gap-1 flex">
          <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-start gap-4 inline-flex">
            <div data-svg-wrapper>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.976"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M9.3051 2.02392C13.2608 1.77989 16.1422 3.40268 17.9496 6.89231C18.9688 9.3519 18.896 11.7757 17.7311 14.1637C19.0419 15.2247 20.3526 16.2858 21.6633 17.3468C22.0379 17.8372 22.0691 18.3469 21.7569 18.876C20.7233 19.9513 19.6519 20.9812 18.5425 21.9656C18.1417 22.0468 17.7672 21.9844 17.4191 21.7783C16.3268 20.4364 15.2345 19.0945 14.1423 17.7525C11.4977 19.0241 8.86588 18.9929 6.24675 17.6589C3.16426 15.7488 1.75993 12.9713 2.03373 9.3265C2.50085 6.15518 4.19648 3.91866 7.12057 2.61687C7.83784 2.3493 8.56604 2.15163 9.3051 2.02392ZM9.86683 4.70778C12.5677 4.67875 14.4713 5.88543 15.5778 8.32785C16.379 10.8336 15.8069 12.9661 13.8614 14.7254C11.9474 16.1105 9.90846 16.3185 7.74472 15.3496C5.25679 13.8576 4.3102 11.6835 4.90483 8.82718C5.70543 6.41545 7.35943 5.04232 9.86683 4.70778Z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="grow shrink basis-0 h-6 text-[#5c5c5c] text-sm font-normal font-['Sora'] leading-normal">
              Search ...
            </div>
          </div>
        </div>
        <div className="self-stretch h-56 flex-col justify-start items-start gap-1 flex">
          <div className="text-white text-sm font-bold font-['Sora'] leading-normal">
            Hot Topic
          </div>
          <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
            Science and technology
          </div>
          <div className="self-stretch justify-start items-center gap-2 inline-flex">
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🧬 Biology
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🕸️ Web3
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🔬 Scientific research
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                💻 Computer
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                {" "}
                🔧 Engineering
              </div>
            </div>
            <div className="px-3 py-1 bg-[#a668ff] rounded-3xl justify-center items-center gap-2 flex">
              <div className="text-center text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
                More
              </div>
            </div>
          </div>
          <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
            Work and business
          </div>
          <div className="self-stretch justify-start items-center gap-2 inline-flex">
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                💼 Business
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🪙 Bitcoin
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🪙 Crypto
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                💵 Money
              </div>
            </div>
            <div className="px-3 py-1 bg-[#a668ff] rounded-3xl justify-center items-center gap-2 flex">
              <div className="text-center text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
                More
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🔗 Blockchain
              </div>
            </div>
          </div>
        </div>
        <div className="self-stretch h-24 flex-col justify-start items-start gap-1 flex">
          <div className="text-white text-sm font-bold font-['Sora'] leading-normal">
            Popular Topic
          </div>
          <div className="self-stretch justify-start items-center gap-2 inline-flex">
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🦁 Animals
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🍕 Food
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🍹Drink
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                💄 Appearance
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                💊 Health
              </div>
            </div>
            <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
              <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                🎭 Culture
              </div>
            </div>
            <div className="px-3 py-1 bg-[#a668ff] rounded-3xl justify-center items-center gap-2 flex">
              <div className="text-center text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
                More
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
