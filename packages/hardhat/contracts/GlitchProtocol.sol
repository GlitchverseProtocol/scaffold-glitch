//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { ERC721Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ContextUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

interface IRhizomaticToken {
	function stream() external view returns (string memory); // data:[<mediatype>][;base64],<data>

	function dataType() external view returns (string memory); // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
}

interface IGlitchProtocolToken {
	function initialize(
		address _owner,
		string memory _name,
		string memory _symbol,
		string memory _dataType,
		string memory baseURI_
	) external;
}

contract GlitchProtocolToken is
	ERC721Upgradeable,
	AccessControlUpgradeable,
	IRhizomaticToken
{
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
	bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

	string public stream;
	string public dataType;
	string private __baseURI;

	function initialize(
		address _owner,
		string memory _name,
		string memory _symbol,
		string memory _dataType,
		string memory baseURI_
	) public initializer {
		__ERC721_init(_name, _symbol);
		_grantRole(DEFAULT_ADMIN_ROLE, _owner);
		dataType = _dataType;
		__baseURI = baseURI_;
	}

	function _baseURI() internal view override returns (string memory) {
		return __baseURI;
	}

	function setBaseURI(string memory baseURI_) public {
		require(
			hasRole(OWNER_ROLE, _msgSender()),
			"GlitchProtocolToken: must have owner role to set baseURI"
		);
		__baseURI = baseURI_;
	}

	function mint(address to, uint256 tokenId) public {
		require(
			hasRole(MINTER_ROLE, _msgSender()),
			"GlitchProtocolToken: must have minter role to mint"
		);
		_mint(to, tokenId);
	}

	function updateStream(string memory _stream) public {
		require(
			hasRole(ORACLE_ROLE, _msgSender()),
			"GlitchProtocolToken: must have oracle role to update stream"
		);
		stream = _stream;
	}

	function supportsInterface(
		bytes4 interfaceId
	)
		public
		view
		override(ERC721Upgradeable, AccessControlUpgradeable)
		returns (bool)
	{
		return
			interfaceId == type(IRhizomaticToken).interfaceId ||
			super.supportsInterface(interfaceId);
	}
}

contract GlitchProtocolFactory {
	event TokenCreated(
		address indexed token,
		address indexed owner,
		string name,
		string symbol,
		string dataType,
		string baseURI
	);
	address public immutable implementation;

	constructor(address _implementation) {
		implementation = _implementation;
	}

	uint256 public tokenCount;
	address[] public registeredTokens;
	mapping(address => bool) public isRegisteredToken;

	function createToken(
		bytes32 salt,
		string memory _name,
		string memory _symbol,
		string memory _dataType,
		string memory baseURI_
	) external returns (address newToken) {
		// Create Plantoid proxy
		newToken = Clones.cloneDeterministic(
			implementation,
			_saltedSalt(msg.sender, salt)
		);

		IGlitchProtocolToken(newToken).initialize(
			msg.sender,
			_name,
			_symbol,
			_dataType,
			baseURI_
		);

		registeredTokens.push(newToken);
		isRegisteredToken[newToken] = true;
		tokenCount += 1;
		emit TokenCreated(
			newToken,
			msg.sender,
			_name,
			_symbol,
			_dataType,
			baseURI_
		);
	}

	function getRegisteredTokensPaginated(
		uint256 page,
		uint256 pageSize
	) external view returns (address[] memory) {
		address[] memory tokens = new address[](pageSize);
		uint256 startIndex = page * pageSize;
		uint256 endIndex = startIndex + pageSize;
		for (uint256 i = startIndex; i < endIndex; i++) {
			tokens[i] = registeredTokens[i];
		}
		return tokens;
	}

	/**
	 * @dev Returns the salted salt.
	 *      To prevent griefing and accidental collisions from clients that don't
	 *      generate their salt properly.
	 * @param by   The caller of the {createSoundAndMints} function.
	 * @param salt The salt, generated on the client side.
	 * @return result The computed value.
	 */
	function _saltedSalt(
		address by,
		bytes32 salt
	) internal pure returns (bytes32 result) {
		assembly {
			// Store the variables into the scratch space.
			mstore(0x00, by)
			mstore(0x20, salt)
			// Equivalent to `keccak256(abi.encode(by, salt))`.
			result := keccak256(0x00, 0x40)
		}
	}
}
