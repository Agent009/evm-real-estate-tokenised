// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
//import {Property} from "./Property.sol";
import {Property} from "./PropertyERC.sol";

/**
 * @title AddProperty
 * @author Adam B Group 4 
 * @notice Contract for listing and managing real estate properties as tokens
 * @dev Handles property listing, investment tracking, and tokenization status
 */
contract AddProperty is IERC1155Receiver {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error AddProperty__PropertyAlreadyExists();
    error AddProperty__InvalidAddress();
    error AddProperty__UserAlreadyExists();
    error AddProperty__NotUser();

    /*//////////////////////////////////////////////////////////////
                                 STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    Property public property;

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    struct AddingProperty {
        address propertyAddress;
        uint256 tokenId;
        uint256 amount;
    }

    struct PropertyMetadata {
        uint256 rooms;
        uint256 squareFoot;
        uint256 listPrice;
    }

    AddingProperty[] public properties;
    address[] public propertyOwnersList;
    address[] public users;

    mapping(uint256 => address) public propertyAddress; // propertyId to owner address 
    mapping(uint256 => PropertyStatus) public propertyStatus; // propertyId to property status
    mapping(address => bool) public isUser; // address to user status

    /// @dev In Solidity, when you access a mapping with a key that hasn't been set,
    /// it returns the default value for the value type. For an enum, the default value
    /// is the first defined enum value (index 0).
    /// So, we're adding an initial state value to overcome this issue.
    enum PropertyStatus {
        NotListed,  // Default state
        Listed,
        FullyFunded,
        Tokenized
    }

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event PropertyAdded(
        uint256 indexed tokenId,
        address indexed owner,
        address indexed propertyAddress,
        uint256 amount,
        string propertyURI
    );

    event UserAdded(address indexed user);

    constructor(address _property) {
        property = Property(_property);
    }

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyUser() {
        if(!isUser[msg.sender]) revert AddProperty__NotUser();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Adds a user to the list of users
     * @param _user The address of the user
     */
    function addUser(address _user) external {
        if(isUser[_user]) revert AddProperty__UserAlreadyExists();
        users.push(_user);
        isUser[_user] = true;

        emit UserAdded(_user);
    }

    /**
     * @notice Adds a property to the listing for users to invest in
     * an NFT is minted to the property lister to fractionalize
     * @param _propertyAddress The address of the property
     * @param _tokenId The tokenId of the property
     * @param _nftAmount The amount of NFTs to mint to the property lister
     */
    function addPropertyToListing(
        address _propertyAddress, 
        uint256 _tokenId, 
        uint256 _propertyAmount,
        uint256 _nftAmount,
        PropertyMetadata memory _metadata
    ) external onlyUser {
        if(_propertyAddress == address(0)) revert AddProperty__InvalidAddress();
        
        // checks the tokenId to make sure it is not already existing
        if(propertyAddress[_tokenId] != address(0)) revert AddProperty__PropertyAlreadyExists();
        
        AddingProperty memory newProperty = AddingProperty(
            _propertyAddress,
            _tokenId,
            _propertyAmount
        );
        properties.push(newProperty);
        
        // update status and ownership
        propertyStatus[_tokenId] = PropertyStatus.Listed;
        propertyAddress[_tokenId] = _propertyAddress;
        propertyOwnersList.push(msg.sender);

        // create a URI for the property
        property.setURI(
            generatePropertyURI(
                _metadata.rooms,
                _metadata.squareFoot,
                _propertyAddress,
                _metadata.listPrice
            )
        );

        // Mint NFT to this contract first
        // property.mint(address(this), s_propertyId, _nftAmount, "");
        // Then transfer the minted tokens to the user
        // property.safeTransferFrom(address(this), msg.sender, s_propertyId, _nftAmount, "");
        property.mint(msg.sender, _tokenId, _nftAmount, "");

        emit PropertyAdded(
            _tokenId, 
            msg.sender, 
            _propertyAddress, 
            _propertyAmount,
            generatePropertyURI(_metadata.rooms, _metadata.squareFoot, _propertyAddress, _metadata.listPrice)
        );
    }

    /**
     * @notice Generates a URI for a property
     * @param rooms The number of rooms in the property
     * @param squareFoot The square footage of the property
     * @param propertyAddr The address of the property
     * @param listPrice The list price of the property
     * @return The URI for the property
     */
    function generatePropertyURI(
        uint256 rooms,
        uint256 squareFoot,
        address propertyAddr,
        uint256 listPrice
    ) internal pure returns (string memory) {
        string memory uri = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Property",',
                        '"description": "Property Description",', 
                        '"image": "",', 
                        '"attributes": {"rooms": "', 
                        rooms, 
                        '", "squareFoot": "', 
                        squareFoot, 
                        '", "propertyAddress": "', 
                        propertyAddr, 
                        '", "listPrice": "', 
                        listPrice, 
                        '"}}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", uri));
    }

    /*//////////////////////////////////////////////////////////////
                        EXTERNAL VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getPropertyOwners() external view returns (address[] memory) {
        return propertyOwnersList;
    }

    function getPropertyListings() external view returns (AddingProperty[] memory) {
        return properties;
    }

    function getUsers() external view returns (address[] memory) {
        return users;
    }

    /*//////////////////////////////////////////////////////////////
                     IERC1155Receiver IMPLEMENTATION
    //////////////////////////////////////////////////////////////*/
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    // ERC165 support
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
