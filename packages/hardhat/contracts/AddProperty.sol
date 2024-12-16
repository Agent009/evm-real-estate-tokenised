// SPDX-License-Identifier: MIT

//              (
//                 )
//             (            ./\.
//          |^^^^^^^^^|   ./LLLL\.
//          |`.'`.`'`'| ./LLLLLLLL\.
//          |.'`'.'`.'|/LLLL/^^\LLLL\.
//          |.`.''``./LLLL/^ () ^\LLLL\.
//          |.'`.`./LLLL/^  =   = ^\LLLL\.
//          |.`../LLLL/^  _.----._  ^\LLLL\.
//          |'./LLLL/^ =.' ______ `.  ^\LLLL\.
//          |/LLLL/^   /|--.----.--|\ = ^\LLLL\.
//        ./LLLL/^  = |=|__|____|__|=|    ^\LLLL\.
//      ./LLLL/^=     |*|~~|~~~~|~~|*|   =  ^\LLLL\.
//    ./LLLL/^        |=|--|----|--|=|        ^\LLLL\.
//  ./LLLL/^      =   `-|__|____|__|-' =        ^\LLLL\.
// /LLLL/^   =         `------------'        =    ^\LLLL\
// ~~|.~       =        =      =          =         ~.|~~
//   ||     =      =      = ____     =         =     ||
//   ||  =               .-'    '-.        =         ||
//   ||     _..._ =    .'  .-()-.  '.  =   _..._  =  ||
//   || = .'_____`.   /___:______:___\   .'_____`.   ||
//   || .-|---.---|-.   ||  _  _  ||   .-|---.---|-. ||
//   || |=|   |   |=|   || | || | ||   |=|   |   |=| ||
//   || |=|___|___|=|=  || | || | ||=  |=|___|___|=| ||
//   || |=|~~~|~~~|=|   || | || | ||   |=|~~~|~~~|=| ||
//   || |*|   |   |*|   || | || | ||  =|*|   |   |*| ||
//   || |=|---|---|=| = || | || | ||   |=|---|---|=| ||
//   || |=|   |   |=|   || | || | ||   |=|   |   |=| ||
//   || `-|___|___|-'   ||o|_||_| ||   `-|___|___|-' ||
//   ||  '---------`  = ||  _  _  || =  `---------'  ||
//   || =   =           || | || | ||      =     =    ||
//   ||  %@&   &@  =    || |_||_| ||  =   @&@   %@ = ||
//   || %@&@% @%@&@    _||________||_   &@%&@ %&@&@  ||
//   ||,,\\V//\\V//, _|___|------|___|_ ,\\V//\\V//,,||
//   |--------------|____/--------\____|--------------|
//  /- _  -  _   - _ -  _ - - _ - _ _ - _  _-  - _ - _ \
// /____________________________________________________\

pragma solidity ^0.8.22;

<<<<<<< HEAD
import {Property} from "./Property.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
=======
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
//import {Property} from "./Property.sol";
import {Property} from "./PropertyERC.sol";
>>>>>>> 9aecc8d4bfc4cab0b20b0ae5c1805405bb237295

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
        uint256 newTokenId;
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
    mapping(address => uint256) public investorShares;    // investor => amount invested
    mapping(uint256 => mapping(address => uint256)) public propertyInvestments;    // propertyId => (investor => amount)
    mapping(uint256 => PropertyStatus) public propertyStatus;
    mapping(address => bool) public isUser;

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

    uint256 private _nextTokenId = 1;

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
     * @param _nftAmount The amount of NFTs to mint to the property lister
     */

    function addPropertyToListing(
        address _propertyAddress, 
        uint256 _propertyAmount,
        uint256 _nftAmount,
        PropertyMetadata memory _metadata
    ) external onlyUser {
        if(_propertyAddress == address(0)) revert AddProperty__InvalidAddress();
        
        uint256 newTokenId = _nextTokenId++;
        
        if(propertyAddress[newTokenId] != address(0)) revert AddProperty__PropertyAlreadyExists();
        
        AddingProperty memory newProperty = AddingProperty(
            _propertyAddress,
            newTokenId,
            _propertyAmount
        );
        properties.push(newProperty);
        
        // update status and ownership
        propertyStatus[newTokenId] = PropertyStatus.Listed;
        propertyAddress[newTokenId] = _propertyAddress;
        propertyOwnersList.push(msg.sender);

        property.setURI(
            generatePropertyURI(
                _metadata.rooms,
                _metadata.squareFoot,
                _propertyAddress,
                _metadata.listPrice
            )
        );

<<<<<<< HEAD
        property.mint(msg.sender, newTokenId, _nftAmount, "");
=======
        // Mint NFT to this contract first
        // property.mint(address(this), s_propertyId, _nftAmount, "");
        // Then transfer the minted tokens to the user
        // property.safeTransferFrom(address(this), msg.sender, s_propertyId, _nftAmount, "");
        property.mint(msg.sender, _tokenId, _nftAmount, "");
>>>>>>> 9aecc8d4bfc4cab0b20b0ae5c1805405bb237295

        emit PropertyAdded(
            newTokenId, 
            msg.sender, 
            _propertyAddress, 
            _propertyAmount,
            generatePropertyURI(_metadata.rooms, _metadata.squareFoot, _propertyAddress, _metadata.listPrice)
        );
    }

    function generatePropertyURI(
        uint256 rooms,
        uint256 squareFoot,
        address propertyAddr,
        uint256 listPrice
    ) public pure returns (string memory) {
        string memory uri = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Property",',
                        '"description": "Property Description",', 
                        '"image": "ipfs://QmWgZmXVvp83UpLuhRdQUWwT4x8NYPY67kF3u5E2Zqktyn",', 
                        '"attributes": {"rooms": "', 
                        Strings.toString(rooms), 
                        '", "squareFoot": "', 
                        Strings.toString(squareFoot), 
                        '", "propertyAddress": "', 
                        Strings.toHexString(uint160(propertyAddr)), 
                        '", "listPrice": "', 
                        Strings.toString(listPrice), 
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
