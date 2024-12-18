// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {ERC1155BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import {ERC1155SupplyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Property
/// @notice This contract represents a tokenized real estate property using ERC1155 standard
/// @dev Implements ERC1155 with access control, burning, and supply tracking capabilities
contract Property is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, ERC1155BurnableUpgradeable, ERC1155SupplyUpgradeable {
    /// @notice Role identifier for accounts that can set the URI
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    /// @notice Role identifier for accounts that can mint new tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 => string) private _tokenURIs;

    /// @notice Prevents the implementation contract from being initialized
    /// @dev This empty constructor is required for using the contract behind a proxy
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract setting up initial roles
    /// @dev This function replaces the constructor for upgradeable contracts
    /// @param defaultAdmin Address to be granted the default admin role
    /// @param minter Address to be granted the minter role
    function initialize(address defaultAdmin, address minter) initializer public {
        __ERC1155_init("");
        __AccessControl_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(URI_SETTER_ROLE, minter);
    }

    /// @notice Sets the URI for all token types
    /// @dev Can only be called by accounts with URI_SETTER_ROLE
    /// @param newuri The new URI to set
    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    /// @notice Mints new tokens. Will mint (or burn) if `from` (or `to`) is the zero address.
    /// @dev Can only be called by accounts with MINTER_ROLE
    /// @param account The address that will receive the minted tokens
    /// @param id The token id to mint
    /// @param amount The amount of tokens to mint
    /// @param data Additional data with no specified format, sent in call to `_mint`
    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mint(account, id, amount, data);
    }

    /// @notice Mints multiple token types at once
    /// @dev Can only be called by accounts with MINTER_ROLE
    /// @param to The address that will receive the minted tokens
    /// @param ids Array of token ids to mint
    /// @param amounts Array of the amounts of tokens to mint
    /// @param data Additional data with no specified format, sent in call to `_mintBatch`
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyRole(MINTER_ROLE)
    {
        _mintBatch(to, ids, amounts, data);
    }

    /// @notice Hook that is called before any token transfer
    /// @dev This function is overridden to update the token supply
    /// @param from Address tokens are transferred from
    /// @param to Address tokens are transferred to
    /// @param ids Array of token ids being transferred
    /// @param values Array of amounts of tokens being transferred
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155Upgradeable, ERC1155SupplyUpgradeable)
    {
        super._update(from, to, ids, values);
    }

    /// @notice Query if a contract implements an interface
    /// @dev Interface identification is specified in ERC-165
    /// @param interfaceId The interface identifier, as specified in ERC-165
    /// @return bool True if the contract implements `interfaceId` and
    ///         `interfaceId` is not 0xffffffff, false otherwise
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Returns the URI for a given token ID
    /// @dev This function is overridden to include token IDs in the URI
    /// @param tokenId The token ID to get the URI for
    /// @return The URI for the given token ID
    function uri(uint256 tokenId) public view virtual override(ERC1155Upgradeable) returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        return bytes(tokenURI).length > 0 ? tokenURI : super.uri(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) public onlyRole(URI_SETTER_ROLE) {
        _tokenURIs[tokenId] = tokenURI;
    }
}
