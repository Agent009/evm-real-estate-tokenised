// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {AddProperty} from "./AddProperty.sol";
import {Property} from "./Property.sol";
import {PropertyToken} from "./PropertyToken.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

/**
 * @title PropertyVault
 * @author Adam
 * @notice A vault contract that allows users to fractionalize property NFTs
 * into ERC20 tokens and invest in properties using payment tokens
 */
contract PropertyVault is ERC1155Holder {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error PropertyVault__PropertyNotInVault();
    error PropertyVault__PropertyAlreadyTokenized();
    error PropertyVault__NoInvestment();
    error PropertyVault__WithdrawalFailed();
    
    /*//////////////////////////////////////////////////////////////
                                 STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    AddProperty public immutable i_addProperty;
    Property public immutable i_property;
    PropertyToken public propertyToken;
    IERC20 public paymentToken;                     // the ERC20 token used for purchases

    uint256 public constant NFT_AMOUNT = 1;         // one NFT per property when calling safeTransferFrom

    struct Investor {
        uint256 balance;    
        uint256 shares; 
    }

    mapping(uint256 => mapping(address => Investor)) public investors; // tokenId => (investor address => Investor)
    mapping(uint256 => bool) public isPropertyInVault;                // tokenId => bool
    mapping(uint256 => uint256) public propertyValue;                 // tokenId => total ETH invested
    mapping(uint256 => uint256) public sharePrice;                    // tokenId => price per share

    /*//////////////////////////////////////////////////////////////    
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event PropertyAddedToVault(uint256 indexed tokenId);
    event SetSharePrice(uint256 indexed tokenId, uint256 price);
    event SharesPurchased(uint256 indexed tokenId, address buyer, uint256 amount);
    event Withdrawal(uint256 indexed tokenId, address investor, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _addProperty, 
        address _property, 
        address _propertyToken,
        address _paymentToken
    ) {
        i_addProperty = AddProperty(_addProperty);
        i_property = Property(_property);
        propertyToken = PropertyToken(_propertyToken);
        paymentToken = IERC20(_paymentToken);  
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
        if (!isPropertyInVault[_tokenId]) revert PropertyVault__PropertyNotInVault();           // check to not add property in twice
        // if (i_addProperty.propertyStatus(_tokenId) == AddProperty.PropertyStatus.Listed)     // If already fully tokenized then revert
        //     revert PropertyVault__PropertyAlreadyTokenized();

        uint256 cost = _amount * sharePrice[_tokenId];
        paymentToken.transferFrom(msg.sender, address(this), cost);

        propertyValue[_tokenId] += _amount;                       // add amount to property value
        investors[_tokenId][msg.sender].balance += _amount;      // add amount to investor balance
        investors[_tokenId][msg.sender].shares += _amount;      // add amount to investor shares

        // mint fractional tokens to buyer
        propertyToken.mint(msg.sender, _amount);

        emit SharesPurchased(_tokenId, msg.sender, _amount);
    }

    /**
     * @notice Withdraws an investment from the vault and transfers the investment back to the investor
     * @param _tokenId The tokenId of the property
     */
    function withdrawInvestment(uint256 _tokenId) external {
        // get investor balance - may be and easier and better way to write this? 
        uint256 amount = investors[_tokenId][msg.sender].balance;
        if(amount == 0) revert PropertyVault__NoInvestment();

        // reset the investor balance and property value
        investors[_tokenId][msg.sender].balance = 0;
        propertyValue[_tokenId] -= amount;

        // transfer the payment and revert if fails
        bool success = paymentToken.transfer(msg.sender, amount);
        if(!success) revert PropertyVault__WithdrawalFailed();

        emit Withdrawal(_tokenId, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                             EXTERNAL VIEW
    //////////////////////////////////////////////////////////////*/
    function getAvailableShares(uint256 _tokenId) external view returns (uint256) {
        return investors[_tokenId][msg.sender].shares;
    }
}
