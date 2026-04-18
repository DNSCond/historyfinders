import type {Router} from "express-serve-static-core";
import {context, reddit, scheduler, redis} from "@devvit/web/server";
import type {TaskRequest, TaskResponse} from "@devvit/web/server";
import type {UiResponse} from '@devvit/web/shared';
import express from "express";
import {ResolveSecondsAfter} from "anthelpers";

export const router: Router = express.Router(),
    rejectAnyRevisionsBefore_Global: number = Date.parse('2026-04-18T10:00:48.000Z');
router.post<string, never>('/internal/menu/activate-now',
    async (_req, res) => {
        await hourlyCheck(rejectAnyRevisionsBefore_Global);
        res.status(200).json({showToast: {appearance: 'success', text: 'success'}} as UiResponse);
    });
router.post('/internal/cron/hourly-check', async (
    req, res) => {
    // @ts-expect-error
    const rejectAnyRevisionsBefore = +await redis.get('rejectAnyRevisionsBefore');
    await hourlyCheck(Math.max(rejectAnyRevisionsBefore_Global, rejectAnyRevisionsBefore ? 0 : rejectAnyRevisionsBefore));
    res.status(200).json({});
});

async function hourlyCheck(rejectAnyRevisionsBefore: number) {
    const {subredditName} = context,// expiration = ResolveSecondsAfterNow(50000),
        wikipages = await reddit.getWikiPages(subredditName), now = Date.now();
    // const modlog = reddit.getModerationLog({subredditName, type: 'wikirevise'});
    // for await (const modlogEntry of modlog) {console.log(modlogEntry);}
    const promiseList: PromiseLike<unknown>[] = [];
    let index = 0;
    for (const wikipageName of wikipages) {
        if (!wikipageName.startsWith('incomming/')) continue;
        for await (const wikipageRevision of reddit.getWikiPageRevisions({
            subredditName, page: wikipageName, limit: 500,
        })) {
            if (DevvitDateBufFix(wikipageRevision.date).getTime() < rejectAnyRevisionsBefore) {
                continue;
            }
            const unit = ++index;
            const result = /^r\/(t5_[a-z0-9]+)\/(?:(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?)?\//.exec(wikipageRevision.reason);
            if (result) {
                const wikipageRevisionId = wikipageRevision.id;//[, subredditId, _major, _minor, _patch, _pre] = result;
                console.log('manualverification', {wikipageName, wikipageRevisionId})
                promiseList.push(scheduler.runJob({
                    name: 'manualverification', data: {wikipageName, wikipageRevisionId},
                    runAt: ResolveSecondsAfter(unit * 7, now),
                }));
            }
        }
    }
    await Promise.allSettled(promiseList);
}

router.post<string, never, TaskResponse, TaskRequest<{
    wikipageName: string,
    wikipageRevisionId: string
}>>('/internal/scheduler/manualverification', async (
    req, res) => {
    const {data} = req.body, {wikipageName, wikipageRevisionId} = data, {subredditName} = context;
    // @ts-expect-error
    await reddit.getWikiPage(subredditName, wikipageName, wikipageRevisionId).then(wikipage => {
        console.log(wikipage.content)
    });
    res.status(200).json({});
});

function DevvitDateBufFix(bugged_date: Date | string | number) {
    const date = new Date(bugged_date);
    date.setTime(date.getTime() * 1000);
    return date;
}
