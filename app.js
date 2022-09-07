const express = require("express");
const app = express();
const ytdl = require("ytdl-core");
const rp = require('request-promise')

app.listen(process.env.PORT || 8080, () => {
    console.log("Listening to requests on 8080");
});

app.get('/getPlaylist', getPlaylist);
app.get("/getUrl", getUrl)

let serverURl = "https://oriteserver-prod-oti-wzgw83.mo1.mogenius.io"


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
                id: index,
                url: serverURl + "/getUrl?id=" + item.playlistVideoRenderer.videoId,
            });
            index++
        }
        resp.json({ name: ytdata.metadata.playlistMetadataRenderer.title, playlist: playlist });
    } else {
        resp.json(null);
    }
}


async function getUrl(req, res) {
    let id = decodeURI(req.query.id);
    let info = await ytdl.getInfo(id);
    let format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    console.log(format)
    res.redirect(format.url);
}