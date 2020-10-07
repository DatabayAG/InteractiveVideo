- [InteractiveVideo](#interactivevideo)
  * [ILIAS compatibility](#ilias-compatibility)
  * [Important notice](#important-notice)
  * [Changes in Version 2.5.1](#changes-in-version-251)
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
Since there are a lot of changes in ILIAS 6, there will be a new branch '6_x' which is compatible with ILIAS 6, for older ILIAS versions you can still use the master branch.

## Changes in Version 2.5.1
* Compulsory questions
* Automatic scrolling if show all comments is active
* New Learning Progress mode
* Table of contents
* [Complete Changelog](https://github.com/DatabayAG/InteractiveVideo/blob/master/CHANGELOG.md)

## Repositories connected to the InteractiveVideo Plugin
* [COPage Plugin for InteractiveVideo References in LearningModules](https://github.com/DatabayAG/InteractiveVideoReference)
* [Video Source Plugin for Vimeo](https://github.com/DatabayAG/InteractiveVideoVimeo)
* [Video Source Plugin for FAU Video Platform](https://github.com/ilifau/InteractiveVideoFauVideoPortal)

## Installation Instructions
1. Clone this repository to <ILIAS_DIRECTORY>/Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo
2. Login to ILIAS with an administrator account (e.g. root)
3. Select **Plugins** from the **Administration** main menu drop down.
4. Search the **InteractiveVideo** plugin in the list of plugin and choose **Activate** from the **Actions** drop down.

### Workaround patch for making the Interactive Videos work with the Web Access Checker
Simply insert the following line into the file 'Services/MediaObjects/classes/class.ilObjMediaObject.php' at round about line number 1511, which should read like this in the original:

	case "mep":
		$obj_id = $id;
		break;

Insert     case "xvid":    to make it read like this:

	case "mep":
	case "xvid":
		$obj_id = $id;
		break;

That's it.

# What is it for?
The InteractiveVideo Plugin for ILIAS gives you the possibility to create a video object, where your students can communicate in a asynchronous way. Please note that this is *NOT* a chat. They can leave notes on different timestamps in the video for other students to read, or only for themselves. Further a tutor can insert questions on various positions in the video for the students to answer. At the moment three questions types are supported single and multiple choice and a reflective type. 

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
