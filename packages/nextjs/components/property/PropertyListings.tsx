import React, { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/property/LabelAndValue";
import deployedContracts from "@contracts/deployedContracts";
import { useAddPropertyReadData, usePropertyReadData } from "@hooks/property";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { AddingProperty } from "~~/types/property";
import { addPropertyContractAddress, constants, getApiUrl, propertyContractAddress } from "~~/utils";

export const PropertyListings = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  // const [properties, setProperties] = useState<AddingProperty[]>([]);
  const [newProperty, setNewProperty] = useState({
    propertyAddress: "",
    propertyAmount: 1,
    nftAmount: 1,
    rooms: "",
    squareFoot: "",
    listPrice: "",
  });
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
      // await fetchProperties(); // Refresh property list after addition
    } catch (error) {
      console.error("Failed to add property -> error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4 md:min-w-[40rem] w-full">

      {/* List Properties */}
      <div className="mt-5 w-full">
        <h2 className="text-xl font-bold">Property Listings</h2>
        {propertyListings.length > 0 ? (
          propertyListings.map((property: AddingProperty, index: number) => (
            <div key={index} className="card bg-base-200 p-4 mb-3">
              {renderLabelAndValue<string>({
                label: "Property Address",
                value: property.propertyAddress,
                size: "1/2",
              })}
              {/*<p>Address: {property.propertyAddress}</p>*/}
              {/*<p>Rooms: {property.rooms}</p>*/}
              {/*<p>Square Foot: {property.squareFoot}</p>*/}
              {/*<p>List Price: {property.listPrice} tokens</p>*/}
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
              <span className="label-text-alt">Properties</span>
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
              <span className="label-text-alt">NFT Amount</span>
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
        <div className="join">
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              name="rooms"
              placeholder="Rooms"
              type="number"
              value={newProperty.rooms}
              onChange={handleInputChange}
            />
            <div className="label">
              <span className="label-text-alt"></span>
              <span className="label-text-alt"></span>
            </div>
          </label>
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              name="squareFoot"
              placeholder="Square Foot"
              type="number"
              value={newProperty.squareFoot}
              onChange={handleInputChange}
            />
            <div className="label">
              <span className="label-text-alt"></span>
              <span className="label-text-alt"></span>
            </div>
          </label>
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              name="listPrice"
              placeholder="List Price"
              type="number"
              value={newProperty.listPrice}
              onChange={handleInputChange}
            />
            <div className="label">
              <span className="label-text-alt"></span>
              <span className="label-text-alt"></span>
            </div>
          </label>

          {/*<div className="tooltip tooltip-info" data-tip="Add new property to listing">*/}
          {/*  <button disabled={loading} className="btn btn-accent join-item" onClick={submitProperty}>*/}
          {/*    {loading ? <span className="loading loading-spinner"></span> : "Add Property"}*/}
          {/*  </button>*/}
          {/*</div>*/}
        </div>
      </div>
      <div className="tooltip tooltip-info" data-tip="Add new property to listing">
        <button disabled={loading} className="btn btn-accent join-item" onClick={submitProperty}>
          {loading ? <span className="loading loading-spinner"></span> : "Add Property"}
        </button>
      </div>
    </div>
  );
};
