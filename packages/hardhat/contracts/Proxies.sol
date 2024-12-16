// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Because we're using the OpenZeppelin proxy contracts, we need to import them here to make sure Hardhat knows to
// compile them. This will ensure that their artifacts are available for Hardhat Ignition to use later when we're
// writing our Ignition modules. So, we import these here to force Hardhat to compile them.
// // This ensures that their artifacts are available for Hardhat Ignition to use.
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
