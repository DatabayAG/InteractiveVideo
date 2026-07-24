- [InteractiveVideo](#interactivevideo)
  * [ILIAS compatibility](#ilias-compatibility)
  * [Important notice](#important-notice)
  * [Repositories connected to the InteractiveVideo Plugin](#repositories-connected-to-the-interactivevideo-plugin)
  * [Installation Instructions](#installation-instructions)
    + [Workaround patch for making the Interactive Videos work with the Web Access Checker](#workaround-patch-for-making-the-interactive-videos-work-with-the-web-access-checker)
- [What is it for?](#what-is-it-for-)
  * [Interactive Video Main View](#interactive-video-main-view)
  * [Interactive Video Question View](#interactive-video-question-view)
  * [Interactive Video Create Images from Media Object Source](#interactive-video-create-images-from-media-object-source)
  * [Interactive Video Create Question](#interactive-video-create-question)
  * [Interactive Video Sources & Plugin Slots](#interactive-video-sources---plugin-slots)
  * [Interactive Video Modal options](#interactive-video-modal-options)
  * [Interactive Video Subtitles](#interactive-video-subtitles)
  * [Interactive Video Compulsory Questions](#interactive-video-compulsory-questions)
  * [Interactive Video Learning_progress](#interactive-video-learning-progress)
  * [Interactive Video Table of Contents](#interactive-video-table-of-content)

# InteractiveVideo
ILIAS Interactive Video Plugin

## ILIAS compatibility
- The branch **r11_dev** is compatible with **ILIAS 11** (plugin version 3.11.x, PHP `>=8.3 <8.5`)
- The branch r10_dev is compatible with ILIAS 10
- The branch r9 is compatible with ILIAS 9
- The branch r8 is compatible with ILIAS 8
- If you are looking for a ILIAS 6 or ILIAS 7 compatible version of the plugin, please use the master branch.
- If you are looking for a ILIAS 5.2-5.4 compatible version, please use the release_2 branch.
- For even older ILIAS versions, please use the release_1 branch.

## Changes in version 3.11.8
1. Align PHP constraint with ILIAS 11 (`>=8.3 <8.5`)
2. Resolve plugin asset/icon paths via `getRelativeDirectory()` / `getDirectory()`

## Changes in version 3.11.6
1. ILIAS 11 compatibility fixes: WAC secure-path registration, legacy table migration
2. Migrated remaining result tables to KS/UI Data Table API

## Changes in version 3.11.5
1. Compatibility with ILIAS 11.0

## Changes in version 3.10.5
1. Compatibility with ILIAS 10.0

## Important notice
If you upgrade to the 2.x version of the InteractiveVideo you can not go back to version 1.x, because there are migration steps which alter the database schema.

## Changes in earlier versions
* [Complete Changelog](https://github.com/DatabayAG/InteractiveVideo/blob/master/CHANGELOG.md)

## Repositories connected to the InteractiveVideo Plugin
* [COPage Plugin for InteractiveVideo References in LearningModules](https://github.com/DatabayAG/InteractiveVideoReference)
* [Video Source Plugin for Vimeo](https://github.com/DatabayAG/InteractiveVideoVimeo)
* [Video Source Plugin for Opencast](https://github.com/DatabayAG/InteractiveVideoOpenCast)

## Installation Instructions
1. Clone this repository to <ILIAS_DIRECTORY>/Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo
2. Login to ILIAS with an administrator account (e.g. root)
3. Select **Plugins** from the **Administration** main menu drop down.
4. Search the **InteractiveVideo** plugin in the list of plugin and choose **Activate** from the **Actions** drop down.

### Web Access Checker (WAC)

The plugin registers its WAC secure path (`xvid`) automatically during the database update
(steps 43 and 89 in `sql/dbupdate.php`). After activating or updating the plugin, run
**Update Database** in **Administration → Plugins** if the registration has not been applied yet.

### Media object usage tracking (optional core patch)

For correct media-pool usage resolution, add `xvid` to the switch in
`components/ILIAS/MediaObjects/MediaObject/class.ilObjMediaObject.php` (alongside `mep`):

```php
case "mep":
case "xvid":
    $obj_id = $id;
    break;
```

# What is it for?
The InteractiveVideo Plugin for ILIAS gives you the possibility to create a video object, where your students can communicate in a asynchronous way. Please note that this is *NOT* a chat. They can leave notes on different timestamps in the video for other students to read, or only for themselves. Further a tutor can insert questions on various positions in the video for the students to answer. At the moment three questions types are supported single and multiple choice and a reflective type.

## Add SVG Marker Select Form
![Add SVG Marker Select Form](https://databayag.github.io/InteractiveVideo/2.5.x/new_marker_feature_1.png)

## Add SVG Marker Select Position
![Add SVG Marker Select Position](https://databayag.github.io/InteractiveVideo/2.5.x/new_marker_feature_2.png)

## Edit/Create Screen for Comments
![Edit Comment Screen](https://databayag.github.io/InteractiveVideo/2.5.x/new_edit_screen_comments.png)

## Marker and Replies in the question and comment table
![Question and Comments Table](https://databayag.github.io/InteractiveVideo/2.5.x/marker_and_replies.png)

## Interactive Video Main View
![Main View](https://databayag.github.io/InteractiveVideo/2.0.x/1.png)

## Interactive Video Question View
![Question View](https://databayag.github.io/InteractiveVideo/2.0.x/2.png)

## Interactive Video Create Images from Media Object Source
![Create Images from Media Object Source](https://databayag.github.io/InteractiveVideo/2.0.x/3.png)

## Interactive Video Create Question
![Create Question](https://databayag.github.io/InteractiveVideo/2.0.x/4.png)

## Interactive Video Sources & Plugin Slots
![Main View](https://databayag.github.io/InteractiveVideo/2.0.x/5.png)

## Interactive Video Modal options
![Modal settings](https://databayag.github.io/InteractiveVideo/2.0.18/modal_options.png)

## Interactive Video Subtitles
![Subtitle](https://databayag.github.io/InteractiveVideo/2.0.21/subtitle.png)

## Interactive Video Compulsory Questions
![Compulsory_question](https://databayag.github.io/InteractiveVideo/2.5.1/compulsory_question.png)

## Interactive Video Learning Progress
![Learning_progress](https://databayag.github.io/InteractiveVideo/2.5.1/learning_progress.png)

## Interactive Video Table of Content
![Table_of_content](https://databayag.github.io/InteractiveVideo/2.5.1/table_of_content.png)
