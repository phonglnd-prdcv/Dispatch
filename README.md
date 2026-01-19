Resgrid Dispatch
===========================

Resgrid Dispatch an Ionic progressive web application (pwa), mobile app and Electron app that is intended for Dispatchers for Computer Aided Dispatch (CAD) user interface for Resgrid. 

*********



About Resgrid
-------------
Resgrid is an open-source Computer Aided Dispatch (CAD) solution for first responders, businesses and industrial environments. 

[Sign up for your free Resgrid Account Today!](https://resgrid.com)

## Configuration

You will need to create a .env file

```json
// .env
BASE_API_URL=
API_URL=
CHANNEL_URL=
CHANNEL_HUB_NAME=
LOG_LEVEL=
OSM_MAP_KEY=
GOOGLE_MAPS_KEY=
LOGGING_KEY=
```

## Settings

### .env Values
<table>
  <tr>
    <th>Setting</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>BASE_API_URL</td>
    <td>
      The base URL to talk to the Resgrid API (Services) for our hosted production system this is "https://api.resgrid.com"
    </td>
  </tr>
  <tr>
    <td>API_URL</td>
    <td>
      The version api path for the BASE_API_URL for the hosted system the default is "/api/v4"
    </td>
  </tr>
  <tr>
    <td>CHANNEL_URL</td>
    <td>
      The URL to connect to the SignalR hub for our hosted production system this is "https://events.resgrid.com/"
    </td>
  </tr>
  <tr>
    <td>CHANNEL_HUB_NAME</td>
    <td>
      The SignalR hub name to connect to receive events for. The hosted system default is "eventingHub"
    </td>
  </tr>
  <tr>
    <td>LOG_LEVEL</td>
    <td>
      Log level for the Ngx-ResgridLib library: 0 = Debug and above, 1 = Warn and above, 2 = Error only, -1 = Off
    </td>
  </tr>
  <tr>
    <td>OSM_MAP_KEY</td>
    <td>
      API Key for MapTiler.com
    </td>
  </tr>
  <tr>
    <td>GOOGLE_MAPS_KEY</td>
    <td>
      API Key for Google Maps, ensure the geocoding forward and reverse permissions and apis are available to it.
    </td>
  </tr>
  <tr>
    <td>LOGGING_KEY</td>
    <td>
      Sentry.io logging key
    </td>
  </tr>
</table>

## Docker Deployment

### Building the Docker Image

```bash
# Build the Docker image
yarn docker:build

# Or using docker directly
docker build -t resgrid-dispatch-web .
```

### Running with Docker

1. Copy the example environment file:
```bash
cp .env.docker.example .env.docker
```

2. Edit `.env.docker` with your configuration values.

3. Run the container:
```bash
# Using yarn script
yarn docker:run

# Or using docker-compose
yarn docker:up
```

### Docker Environment Variables

The following environment variables can be set at runtime (no rebuild required):

| Variable | Default | Description |
|----------|---------|-------------|
| `DISPATCH_BASE_API_URL` | `https://api.resgrid.com` | Base URL for the Resgrid API |
| `DISPATCH_API_VERSION` | `v4` | API version |
| `DISPATCH_RESGRID_API_URL` | `/api/v4` | API path |
| `DISPATCH_CHANNEL_HUB_NAME` | `eventingHub` | SignalR events hub name |
| `DISPATCH_REALTIME_GEO_HUB_NAME` | `geolocationHub` | SignalR geolocation hub name |
| `DISPATCH_LOGGING_KEY` | `` | Logging API key |
| `DISPATCH_APP_KEY` | `` | Application key |
| `DISPATCH_MAPBOX_PUBKEY` | `` | Mapbox public key |
| `DISPATCH_SENTRY_DSN` | `` | Sentry DSN for error tracking |
| `DISPATCH_COUNTLY_APP_KEY` | `` | Countly analytics app key |
| `DISPATCH_COUNTLY_SERVER_URL` | `` | Countly server URL |
| `DISPATCH_MAINTENANCE_MODE` | `false` | Enable maintenance mode |

### Docker Commands

```bash
# Build image
yarn docker:build

# Run container with environment file
yarn docker:run

# Start with docker-compose (detached)
yarn docker:up

# Stop docker-compose services
yarn docker:down

# View logs
yarn docker:logs
```

### Manual Docker Run

```bash
docker run -d \
  -p 3000:80 \
  -e DISPATCH_BASE_API_URL=https://api.resgrid.com \
  -e DISPATCH_API_VERSION=v4 \
  -e DISPATCH_MAPBOX_PUBKEY=your_mapbox_key \
  --name resgrid-dispatch \
  resgrid-dispatch-web
```

### Pull from Docker Hub

    docker pull resgridllc/dispatch

## Author's ##
* Shawn Jackson (Twitter: @DesignLimbo Blog: http://designlimbo.com)
* Jason Jarrett (Twitter: @staxmanade Blog: http://staxmanade.com)

## License ##
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

## Acknowledgments