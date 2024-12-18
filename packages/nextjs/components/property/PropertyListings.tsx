import React, { useEffect, useState } from "react";
import Image from "next/image";
import { renderLabelAndValue } from "@components/property/LabelAndValue";
import deployedContracts from "@contracts/deployedContracts";
import { useAddPropertyReadData, usePropertyReadData } from "@hooks/property";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { notification } from "@utils/scaffold-eth";
import { useAccount } from "wagmi";
import { AddingProperty, PropertyMetadata } from "~~/types/property";
import { addPropertyContractAddress, constants, getApiUrl, propertyContractAddress } from "~~/utils";

type PropertyURI = {
  [key: number]: {
    name?: string;
    description?: string;
    image?: string;
    attributes: PropertyMetadata;
  };
};
type NFTBalance = {
  [key: number]: number;
};

export const PropertyListings = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  // const [properties, setProperties] = useState<AddingProperty[]>([]);
  const [newProperty, setNewProperty] = useState({
    propertyAddress: address,
    propertyAmount: 1,
    nftAmount: 100,
    rooms: 1,
    squareFoot: 500,
    listPrice: 100000,
  });
  const [uri, setUri] = useState<PropertyURI>([]);
  const [nftBalance, setNftBalance] = useState<NFTBalance>([]);
  const [loading, setLoading] = useState(false);
  console.log("PropertyListings -> init -> isConnected", isConnected, "chainId", chainId, "mounted", mounted);
  // @ts-expect-error ignore
  const addPropertyDeployment = deployedContracts[chainId]?.AddProperty;
  const addPropertyAddress = addPropertyDeployment?.address || addPropertyContractAddress;
  const { data: propertyAddress } = useScaffoldReadContract({
    contractName: "AddProperty",
    functionName: "property",
    args: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addPropertyData = useAddPropertyReadData(addPropertyAddress);
  const propertyData = usePropertyReadData(propertyAddress || propertyContractAddress);

  // const fetchProperties = useCallback(async () => {
  //   const propertyList = (await addPropertyData("getPropertyListings")) as unknown as AddingProperty[];
  //   setProperties(propertyList);
  //   console.log(`PropertyListings -> fetchProperties -> propertyList`, propertyList);
  // }, [addPropertyData]);

  useEffect(() => {
    if (isConnected) {
      setMounted(true);
    }
  }, [isConnected]);

  // useEffect(() => {
  //   if (!mounted || !propertyAddress) return;
  //
  //   fetchProperties();
  // }, [fetchProperties, mounted, propertyAddress, addPropertyData]);

  const { data: propertyOwners } = useScaffoldReadContract({
    contractName: "AddProperty",
    functionName: "getPropertyOwners",
    args: [],
  });
  const { data: propertyListings } = useScaffoldReadContract({
    contractName: "AddProperty",
    functionName: "getPropertyListings",
    args: [],
  });
  const { data: propertyUsers } = useScaffoldReadContract({
    contractName: "AddProperty",
    functionName: "getUsers",
    args: [],
  });
  console.log(
    "PropertyListings -> propertyOwners",
    propertyOwners,
    "propertyListings",
    propertyListings,
    "propertyUsers",
    propertyUsers,
  );

  // Handle input changes for new property
  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    console.log("PropertyListings -> handleInputChange -> e.target", e.target);
    // @ts-expect-error ignore
    const { name, value } = e.target;
    setNewProperty({ ...newProperty, [name]: value });
  };

  // Add a new property
  const submitProperty = async () => {
    setLoading(true);

    try {
      console.log(`PropertyListings -> submitProperty -> newProperty`, newProperty);

      if (
        newProperty.propertyAddress === "" ||
        newProperty.propertyAmount <= 0 ||
        newProperty.nftAmount <= 0 ||
        newProperty.rooms <= 0 ||
        newProperty.squareFoot <= 0 ||
        newProperty.listPrice <= 0
      ) {
        notification.error("Please fill in all required fields.");
        return;
      }

      const response = await fetch(getApiUrl(constants.routes.api.addProperty), {
        method: "POST",
        body: JSON.stringify({
          chainId: chainId,
          userAddress: address,
          propertyAddress: newProperty.propertyAddress,
          propertyAmount: newProperty.propertyAmount,
          nftAmount: newProperty.nftAmount,
          rooms: newProperty.rooms,
          squareFoot: newProperty.squareFoot,
          listPrice: newProperty.listPrice,
        }),
      });
      const data = await response.json();
      console.log("Property added -> data", data);

      if (data?.message) {
        notification.success(data?.message);
      } else {
        notification.error(data?.error + "\n" + data?.details);
      }
      // await fetchProperties(); // Refresh property list after addition
    } catch (error) {
      console.error("Failed to add property -> error", error);
      // @ts-expect-error ignore
      notification.error("Failed to add property. " + error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a new property
  const getMetadata = async (tokenId: bigint) => {
    setLoading(true);

    try {
      console.log(`PropertyListings -> getMetadata -> tokenId`, tokenId);

      if (!tokenId) {
        notification.error("Please provide the property token ID.");
        return;
      }

      const metadata = (await propertyData("uri", [tokenId])) as string;
      const nft = (await propertyData("balanceOf", [address, tokenId])) as bigint;
      // Extract the base64 part, decode the base64 string and parse the JSON.
      const decoded = JSON.parse(atob(metadata.split(",")[1]));
      console.log("PropertyListings -> getMetadata -> nft", nft, "metadata", metadata, "decoded", decoded);
      setUri({
        [Number(tokenId)]: {
          name: decoded.name,
          description: decoded.description,
          image: decoded.image,
          attributes: decoded.attributes,
        },
      });
      setNftBalance({ [Number(tokenId)]: Number(nft) });
    } catch (error) {
      console.error("Failed to get token uri -> error", error);
      // @ts-expect-error ignore
      notification.error("Failed to get token uri. " + error?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4 md:min-w-[40rem] w-full">
      {/* List Properties */}
      <div className="mt-5 w-full">
        <h2 className="text-xl font-bold">Property Listings ({propertyListings?.length || 0})</h2>
        {propertyListings?.length > 0 ? (
          propertyListings.map((property: AddingProperty, index: number) => (
            <div
              key={index}
              className={`card bg-base-200 ${uri[Number(property.tokenId)] ? "card-side" : ""} shadow-xl p-4 mb-3`}
            >
              {uri[Number(property.tokenId)] && (
                <figure className={""}>
                  <Image
                    src={
                      // uri[Number(property.tokenId)].image ||
                      "https://ipfs.io/ipfs/QmUYY6w5UiEEhpwWPZ6ca8udrR6gFUQnR5rvWzZQJZxrXm"
                    }
                    alt={uri[Number(property.tokenId)].name || "Property"}
                    width={150}
                    height={150}
                  />
                </figure>
              )}
              <div className="card-body">
                <div className="flex flex-wrap justify-center w-full">
                  {renderLabelAndValue<string>({
                    label: "Property Address",
                    value: property.propertyAddress,
                    size: "1/2",
                  })}
                  {renderLabelAndValue<bigint>({
                    label: "Token ID",
                    value: property.tokenId,
                    size: "1/4",
                    asETH: false,
                  })}
                  {renderLabelAndValue<bigint>({
                    label: "Amount",
                    value: property.amount,
                    size: "1/4",
                    asETH: false,
                  })}
                  {nftBalance[Number(property.tokenId)] &&
                    renderLabelAndValue<bigint>({
                      label: "NFTs",
                      value: BigInt(nftBalance[Number(property.tokenId)]),
                      size: "1/4",
                      asETH: false,
                    })}
                  <button disabled={loading} className="btn btn-accent" onClick={() => getMetadata(property.tokenId)}>
                    {loading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {uri[Number(property.tokenId)] && (
                  <div className="flex flex-wrap justify-center w-full">
                    {renderLabelAndValue<bigint>({
                      label: "Rooms",
                      value: uri[Number(property.tokenId)].attributes.rooms,
                      size: "1/4",
                      asETH: false,
                    })}
                    {renderLabelAndValue<bigint>({
                      label: "Square Foot",
                      value: uri[Number(property.tokenId)].attributes.squareFoot,
                      size: "1/4",
                      asETH: false,
                    })}
                    {renderLabelAndValue<bigint>({
                      label: "List Price",
                      value: uri[Number(property.tokenId)].attributes.listPrice,
                      size: "1/4",
                      asETH: false,
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No properties found.</p>
        )}
      </div>

      {/* Add New Property */}
      <h2 className="text-xl font-bold">Add New Property Listing</h2>
      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Address</span>
              {/*<span className="label-text-alt">Address</span>*/}
            </div>
            <input
              className="input input-accent bg-base-200 join-item"
              name="propertyAddress"
              placeholder="Property Address"
              type="string"
              value={newProperty.propertyAddress}
              onChange={handleInputChange}
            />
          </label>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Amount</span>
              {/*<span className="label-text-alt">to add</span>*/}
            </div>
            <input
              className="input input-accent bg-base-200 join-item"
              name="propertyAmount"
              placeholder="Amount"
              type="number"
              value={newProperty.propertyAmount}
              onChange={handleInputChange}
            />
          </label>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">NFT Amount</span>
              {/*<span className="label-text-alt">to mint</span>*/}
            </div>
            <input
              className="input input-accent bg-base-200 join-item"
              name="nftAmount"
              placeholder="NFT Amount"
              type="number"
              value={newProperty.nftAmount}
              onChange={handleInputChange}
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Rooms</span>
              <span className="label-text-alt"></span>
            </div>
            <input
              className="input input-accent bg-base-200 join-item"
              name="rooms"
              placeholder="Rooms"
              type="number"
              value={newProperty.rooms}
              onChange={handleInputChange}
            />
          </label>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Sq Foot</span>
              <span className="label-text-alt"></span>
            </div>
            <input
              className="input input-accent bg-base-200 join-item"
              name="squareFoot"
              placeholder="Square Foot"
              type="number"
              value={newProperty.squareFoot}
              onChange={handleInputChange}
            />
          </label>
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">List Price</span>
              <span className="label-text-alt"></span>
            </div>
            <input
              className="input input-accent bg-base-200 join-item"
              name="listPrice"
              placeholder="List Price"
              type="number"
              value={newProperty.listPrice}
              onChange={handleInputChange}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-center mt-5">
        <div className="tooltip tooltip-info" data-tip="Add new property to listing">
          <button disabled={loading} className="btn btn-accent join-item" onClick={submitProperty}>
            {loading ? <span className="loading loading-spinner"></span> : "Add Property"}
          </button>
        </div>
      </div>
    </div>
  );
};
