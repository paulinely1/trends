const twitter = require('twitter-lite')
const axios = require('axios')

const client = new twitter({
    subdomain: "api", // "api" is the default (change for other subdomains)
    version: "1.1", // version "1.1" is the default (change for other subdomains)
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

module.exports = {
    async index(req, res){
        try {
            
            const regiao = req.params.regiao || 1

            /*
            * TRENDS TWITTER
            */
            console.log(":: coletando trends do twitter...")

            woeidRegiao = {
                1: 23424768, // brazil
                2: 455827, // sao paulo
                3: 455825, // rio de janeiro
                4: 455824 // recife
            }
            const woeid = woeidRegiao[regiao]

            const requestTwitter = await client.get("trends/place", {
                id: woeid
            })
            const trendsTwitter = requestTwitter[0].trends

            if (trendsTwitter.length < 1){
                return res.json({erro: "erro ao coletar trends do twitter"})
            }

            console.log(" : request twitter ok!")

            /*
            * TRENDS YOUTUBE
            */
            console.log(":: coletando trends do youtube...")

            const regiaoYoutube = {
                1: "BR"
            }
            const quantidadeVideos = 10
            const url_yt = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=${regiaoYoutube[regiao]}&maxResults=${quantidadeVideos}&key=${process.env.YOUTUBE_TOKEN}`
            
            let requestYoutube = []
            let trendsYoutube = []

            try {
                requestYoutube = await axios.get(url_yt)
            } catch {
                requestYoutube = []
            }

            if (requestYoutube.length < 1)
                console.log(" : erro ao coletar trends do youtube")
            else {
                trendsYoutube = requestYoutube.data.items
                console.log(" : request youtube ok!")
            }

            console.log(":: concatenando trends...")

            let meusTrendsTT = []
            let meusTrendsYT = []

            for (const item of trendsTwitter) {
                meusTrendsTT.push({
                    titulo: item.name,
                    keywords: [item.name],
                    url: item.url,
                })
            }

            if (trendsYoutube.length > 0) {
                for (const item of trendsYoutube) {
                    meusTrendsYT.push({
                        titulo: item.snippet.title,
                        keywords: item.snippet.tags,
                        url: `https://www.youtube.com/watch?v=${item.id}`,
                    })
                }
            }

            console.log(" : concatenacao finalizada!")
        
            let meusTrendsFinal = {
                "twitter": meusTrendsTT,
                "youtube": meusTrendsYT
            }
            
            return res.json(meusTrendsFinal)

        } catch(err) {
            console.log(err)
            return res.status(400).json({erros: "ErrorCatch" })
        }
    }
}