"use client";

import { useState } from "react";
import { DeployAddProperty } from "@components/property/DeployAddProperty";
import { Address } from "@components/scaffold-eth";
import { constants } from "@utils/constants";
import type { NextPage } from "next";
import { useAccount } from "wagmi";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("propertyInfo");

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">{constants.app.name}</span>
            <span className="block text-4xl font-bold">{constants.app.caption}</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <DeployAddProperty />
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl">
              <div role="tablist" className="tabs tabs-bordered">
                <a
                  role="tab"
                  className={`tab ${activeTab === "propertyInfo" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("propertyInfo")}
                >
                  Property Info
                </a>
                <a
                  role="tab"
                  className={`tab ${activeTab === "manageTokens" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("manageTokens")}
                >
                  Manage Tokens
                </a>
                <a
                  role="tab"
                  className={`tab ${activeTab === "manageBets" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("manageBets")}
                >
                  Manage Bets
                </a>
              </div>
              {/*{activeTab === "propertyInfo" && <PropertyInfo />}*/}
              {/*{activeTab === "manageTokens" && <ManageTokens />}*/}
              {/*{activeTab === "manageBets" && <ManageBets />}*/}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
