const express = require("express");
const app = express();
const ytdl = require("ytdl-core");
const rp = require('request-promise')

app.listen(process.env.PORT || 8080, () => {
    console.log("Listening to requests on 8080");
});

const sendSeekable = require("send-seekable");
app.use(sendSeekable);
app.get('/getStream', getStream);
app.get('/getPlaylist', getPlaylist);

async function getPlaylist(req, resp) {
    if (decodeURI(req.query.url.length) > 0) {
        let body = await rp(decodeURI(req.query.url));
        let start = body.indexOf("var ytInitialData = ");
        let end = body.indexOf("</script>", start);
        let obj = body.substring(start + 20, end - 1);
        let ytdata = JSON.parse(obj);
        if (ytdata.contents == undefined) {
            resp.json(null);
            return;
        }
        let data = ytdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
        let playlist = [];
        let index = 1
        for (const item of data) {
            playlist.push({
                title: item.playlistVideoRenderer.title.runs[0].text,
                artwork: item.playlistVideoRenderer.thumbnail.thumbnails[0].url,
                videoId: item.playlistVideoRenderer.videoId,
                duration: item.playlistVideoRenderer.lengthText.simpleText,
                artist: item.playlistVideoRenderer.shortBylineText.runs[0].text,
                id,
                url: "https://oriteserver-prod-oti-wzgw83.mo1.mogenius.io/getStream?id=" + item.playlistVideoRenderer.videoId
            });
            id++
        }
        resp.json({ name: ytdata.metadata.playlistMetadataRenderer.title, playlist: playlist });
    } else {
        resp.json(null);
    }
}



async function getStream(req, res) {
    let id = decodeURI(req.query.id);
    let url = "https://www.youtube.com/watch?v=" + id;

    let info = await ytdl.getInfo(id);

    let format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    let type = "audio/mpeg";
    let size = format.contentLength;

    let stream = ytdl(url, {
        format: format,
        requestOptions: {
            headers: DEFAULT_HEADERS,
        },
    });

    res.sendSeekable(stream, {
        type: type,
        length: size,
    });
}

const DEFAULT_HEADERS = {
    "User-Agent": getFirefoxUserAgent(),
    "Accept-Language": "en-US,en;q=0.5",
};
function getFirefoxUserAgent() {
    let date = new Date();
    let version = (date.getFullYear() - 2018) * 4 + Math.floor(date.getMonth() / 4) + 58 + ".0";
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version} Gecko/20100101 Firefox/${version}`;
}

