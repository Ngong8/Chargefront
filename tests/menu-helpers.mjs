// Existing suites follow the product's new Campaign submenu/overwrite confirmation.
export async function campaignClick(page,id='btn-start') {
    if(await page.locator('#btn-campaign').isVisible())await page.locator('#btn-campaign').click();
    await page.locator('#'+id).click();
    if(await page.locator('#confirm-panel').isVisible())await page.locator('#btn-confirm-new').click();
}
export async function endlessDeployment(page) {
    await page.locator('#btn-endless').click();
    if(await page.locator('#endless-resume-panel').isVisible()) {
        await page.locator('#btn-endless-new').click();await page.locator('#btn-confirm-new').click();
    }
}
