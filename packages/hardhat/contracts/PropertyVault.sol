// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {AddProperty} from "./AddProperty.sol";
import {Property} from "./Property.sol";
import {PropertyToken} from "./PropertyToken.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PropertyVault
 * @author Adam B Group 4
 * @notice A vault contract for fractionalizing real estate NFTs into tradeable ERC20 tokens
 * @dev This contract handles:
 *      - Converting property NFTs into ERC20 tokens for fractional ownership
 *      - Managing investments and share distributions
 *      - Tracking property values and share prices
 *      - Enforcing minimum investment lockup periods
 *      - Processing withdrawals and share sales
 */
contract PropertyVault is ERC1155Holder {
    using SafeERC20 for PropertyToken;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error PropertyVault__PropertyNotInVault();
    error PropertyVault__NoInvestment();
    error PropertyVault__NotEnoughShares();
    error PropertyVault__NotEnoughTimePassed();
    error PropertyVault__PropertyNotListed();

    /*//////////////////////////////////////////////////////////////
                                 STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    AddProperty public immutable i_addProperty;
    Property public immutable i_property;
    PropertyToken public propertyToken;

    uint256 public constant NFT_AMOUNT = 1;         // one NFT per property when calling safeTransferFrom
    uint256 public constant MIN_INVESTMENT_TIME = 30 days;

    struct Investor {
        uint256 balance;    
        uint256 shares; 
    }

    mapping(uint256 => mapping(address => Investor)) public investors; // tokenId => (investor address => Investor)
    mapping(uint256 => bool) public isPropertyInVault;                // tokenId => bool
    mapping(uint256 => uint256) public propertyValue;                 // tokenId => total ETH invested
    mapping(uint256 => uint256) public sharePrice;                    // tokenId => price per share
    mapping(uint256 => mapping(address => uint256)) public lastPurchaseTime; // tokenId => (investor address => timestamp)

    /*//////////////////////////////////////////////////////////////    
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event SetSharePrice(uint256 indexed tokenId, uint256 price);
    event SharesPurchased(uint256 indexed tokenId, address buyer, uint256 amount);
    event Withdrawal(uint256 indexed tokenId, address investor, uint256 amount);
    event SharesSold(uint256 indexed tokenId, address seller, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _addProperty, 
        address _property, 
        address _propertyToken
    ) {
        i_addProperty = AddProperty(_addProperty);
        i_property = Property(_property);
        propertyToken = PropertyToken(_propertyToken);
    }

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Adds a property to the vault by using safeTransferFrom to transfer from the owner to the vault
     * and sets the share price for the property
     * @param _tokenId The tokenId of the property
     * @param _pricePerShare The price per share of the property set by the property lister
     */
    function addPropertyToVault(uint256 _tokenId, uint256 _pricePerShare) external {
        AddProperty.AddingProperty[] memory listings = i_addProperty.getPropertyListings();
        if (listings.length == 0) revert PropertyVault__PropertyNotListed();

        isPropertyInVault[_tokenId] = true;
        
        sharePrice[_tokenId] = _pricePerShare;

        i_property.safeTransferFrom(msg.sender, address(this), _tokenId, NFT_AMOUNT, "");
        emit SetSharePrice(_tokenId, _pricePerShare);
    }

    /**
     * @notice Fractionalizes the NFT, created an ERC20 token to allow purchasing shares
     * Follows the CEI pattern
     * @param _amount The amount of shares to purchase
     * @param _tokenId The tokenId of the property
     */
    function fractionalizeNFT(uint256 _amount, uint256 _tokenId) external {
        if (!isPropertyInVault[_tokenId]) revert PropertyVault__PropertyNotInVault();           

        lastPurchaseTime[_tokenId][msg.sender] = block.timestamp;
        uint256 cost = _amount * sharePrice[_tokenId];
        
        propertyToken.safeTransferFrom(msg.sender, address(this), cost);

        propertyValue[_tokenId] += cost;                          
        investors[_tokenId][msg.sender].shares += _amount;      

        // mint fractional tokens to buyer
        propertyToken.mint(msg.sender, _amount);

        emit SharesPurchased(_tokenId, msg.sender, _amount);
    }

    function sellShares(uint256 _amount, uint256 _tokenId) external {
        if (!isPropertyInVault[_tokenId]) revert PropertyVault__PropertyNotInVault();
        if (investors[_tokenId][msg.sender].shares < _amount) 
            revert PropertyVault__NotEnoughShares();
        if (block.timestamp < lastPurchaseTime[_tokenId][msg.sender] + MIN_INVESTMENT_TIME) 
            revert PropertyVault__NotEnoughTimePassed();
        
        uint256 paymentAmount = _amount * sharePrice[_tokenId];
        investors[_tokenId][msg.sender].shares -= _amount;
        investors[_tokenId][msg.sender].balance -= paymentAmount;
        
        // take property tokens from seller
        propertyToken.safeTransferFrom(msg.sender, address(this), _amount);
        // burn the tokens 
        propertyToken.burn(_amount);
        // send payment tokens to seller
        propertyToken.safeTransfer(msg.sender, paymentAmount);

        emit SharesSold(_tokenId, msg.sender, _amount);
    }

    // /**
    //  * @notice Withdraws an investment from the vault and transfers the investment back to the investor
    //  * @param _tokenId The tokenId of the property
    //  */
    // function withdrawInvestment(uint256 _tokenId) external {
    //     // get investor balance - may be and easier and better way to write this? 
    //     uint256 amount = investors[_tokenId][msg.sender].balance;
    //     if(amount == 0) revert PropertyVault__NoInvestment();

    //     // reset the investor balance and property value
    //     investors[_tokenId][msg.sender].balance = 0;
    //     propertyValue[_tokenId] -= amount;

    //     // transfer the payment and revert if fails
    //     propertyToken.safeTransfer(msg.sender, amount);

    //     emit Withdrawal(_tokenId, msg.sender, amount);
    // }

    /*//////////////////////////////////////////////////////////////
                             EXTERNAL VIEW
    //////////////////////////////////////////////////////////////*/
    function getAvailableShares(uint256 _tokenId) external view returns (uint256) {
        return investors[_tokenId][msg.sender].shares;
    }

    function getInvestorShares(uint256 _tokenId, address _investor) external view returns (uint256) {
        return investors[_tokenId][_investor].shares;
    }
}
