# Glitch Protocol

A reference implementation of the Glitch Protocol. The Glitch Protocol establishes a network through which multiple artworks can communicate. Each artwork can reference the data provided by other works on the protocol and use that data to inform its own behavior. 

This repository contains the smart contracts and an API for rendering the network.

### Sample Render (Unmute)


https://github.com/GlitchverseProtocol/scaffold-glitch/assets/4401444/1f08dd5c-aa04-403c-aae3-af75523dcb66


[Live View](https://www.glitchprotocol.xyz/api/render/0x086a8d25386ccdbcd38ea442af3a66f7318baa3b)

This is an example output of a contract on the Glitch Protocol. In this case each connected work is supplying an audio file to the associated contract. Each contract's data stream is made available to a rendering function built with Three.js. Click each contract to hear the audio it is supplying to the network.

Artworks on the protocol can stream any datatypes. The type is specified by including a `mimeType` in the contract's metadata. The rendering function can then use the `mimeType` to determine how to render the data.

Sample Token: https://testnets.opensea.io/assets/sepolia/0x086a8d25386ccdbcd38ea442af3a66f7318baa3b/1

## Streaming Data

To upload data the file is first converted to a base64 string. The base64 string is then compressed and stored on chain. Only the latest stream is stored on chain. This can change in other implementations.

When the `stream` method is called on the contract the data is decompressed into a base64 string and returned to the caller. The caller can then decode the base64 string and use the data in their rendering function.

## Rendering

This reference implementation uses Three.js to display the data available on the network, but artists can choose any rendering library they prefer. Rendering is currently off chain on an API at `glitchprotocol.xyz` but this could be moved on chain in the future.


TokenData is collected from all tokens registered on the protocol using the `GlitchProtocolFactory` contract. This data is then formatted and provided to the rendering script, and appended to the HTML document to create a dynamic NFT.
```js
    interface ITokenData {
      contract: string;
      dataType: string;
      data: string;
      isPrimary?: boolean;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.6.0/p5.js"></script>
        <script>
            let tokenData = ${tokenDataString};

        </script>
        </head>
            <body>
            <div id="container"></div>
            <script type="importmap">
            {
                "imports": {
                "three": "https://unpkg.com/three@0.159.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.159.0/examples/jsm/"
                }
            }
            </script>
            <script type="module" src="${baseUrl}/api/scripts"></script>
            </body>
        </html>
      `;
```

The dynamic NFT is included as an `animation_url` in the token data.

#### Example Token Data

```json
{
  "description": "Glitch Protocol Token",
  "image": "https://logos.mypinata.cloud/ipfs/QmPPjqJErig5X1uXVSTtiZcb81Hw1qn19T46yGEzdin5yE",
  "animation_url": "http://127.0.0.1:3000/api/render/0xF8eb748d9c0A41e71B914A3d1A28d89e26A02886",
  "name": "Glitch Token 1",
  "attributes": [
    {
      "display_type": "number",
      "trait_type": "Connected Tokens",
      "value": 4
    }
  ]
}
```


## Contracts

The factory contract is deployed on Sepolia here: https://sepolia.etherscan.io/address/0x8174af4119f61b5086286ac3a714164dde69aacd

Anyone can call `createToken` to create a new instance of a token connected to the network.

In this case the data is a base64 encoded string of an audio file. The data is compressed and stored on chain. The `dataType` is used to determine how to render the data.

```js
    const data = "data:audio/ogg;base64,T2dnUwACAAAAAAAAAAA0wABAAAAAAQABAAEAlwABAAAAAAEAAQAAAADAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...
```

```markdown
| Name | Type      | Data    |
| ---- | --------- | ------- | ------------------------------------------------------------------ |
| 0    | salt      | bytes32 | 0x7465737433000000000000000000000000000000000000000000000000000000 |
| 1    | _name     | string  | Test Token                                                         |
| 2    | _symbol   | string  | TEST                                                               |
| 3    | _dataType | string  | audio/ogg                                                          |
| 4    | baseURI_  | string  | https://glitchprotocol.xyz/api/token/                              |
```


## API

The API hosts the following:

* Three.js scripts for rendering
* Rendering scripts for each token
* Token data for each token

⚙️ Built using [Scaffold ETH](https://scaffoldeth.io)


## Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)
